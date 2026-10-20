#!/usr/bin/env python3
"""Offline, read-only inventory of a fixed Git commit. Never reads env values."""
import argparse
import collections
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote

ROOT = Path(__file__).resolve().parents[2]

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

class Dependencies(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('src'):
            self.refs.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'modulepreload') and attrs.get('href'):
            self.refs.append(attrs['href'])

def destination(path):
    if path.startswith(('qa/', 'apps/dj-studio/')) or path.endswith(('/qa.html', '/recording-qa.html')) or path.startswith('shield/desktop/'):
        return 'internal-qa-or-source'
    if path in ('index.html', 'pages/web-development.html', 'pages/cv.html', 'pages/blog.html'):
        return 'space-corporate'
    if path.startswith('sanacion/'):
        return 'client-project-preserve'
    if 'ayudaencasa' in path or path == 'pages/marketplace.html':
        return 'independent-product-preserve'
    return 'dev-candidate'

def build(ref):
    commit = git('rev-parse', '--verify', ref + '^{commit}').decode().strip()
    paths = sorted(git('ls-tree', '-r', '--name-only', commit).decode().splitlines())
    known = set(paths)
    entries, uses, missing = [], collections.defaultdict(list), []
    for path in paths:
        if not path.endswith('.html'):
            continue
        raw = git('show', commit + ':' + path).decode('utf-8', errors='replace')
        parser = Dependencies()
        parser.feed(raw)
        local, external = set(), set()
        for dep in parser.refs:
            url = urlsplit(urljoin('https://inventory.invalid/' + path, dep))
            if url.hostname != 'inventory.invalid':
                # Only hostname: never store query credentials or remote resource URLs.
                external.add(url.hostname or url.scheme)
                continue
            resolved = unquote(url.path).lstrip('/')
            # Vite's /src is relative to the DJ subproject root, not the deployed site.
            if path.startswith('apps/dj-studio/') and dep.startswith('/src/'):
                resolved = 'apps/dj-studio/' + resolved
            local.add(resolved)
        for dep in sorted(local):
            uses[dep].append(path)
            if dep not in known:
                missing.append({'entrypoint': path, 'dependency': dep})
        title = re.search(r'<title[^>]*>(.*?)</title>', raw, re.I | re.S)
        entries.append({'source': path, 'route': '/' if path == 'index.html' else '/' + path.removesuffix('index.html') if path.endswith('/index.html') else '/' + path,
                        'title': re.sub(r'\s+', ' ', title.group(1)).strip() if title else '',
                        'recommended_destination': destination(path),
                        'direct_local_scripts_styles': sorted(local), 'external_dependency_hosts': sorted(external)})
    apis, env_names = collections.defaultdict(set), set()
    server_paths = ['worker.js', 'language-premium-auth.mjs', 'ayudaencasa-api.js', 'aws-polly.js', 'community-dinamarca/api.mjs', 'radio-api.js']
    for path in server_paths:
        raw = git('show', commit + ':' + path).decode()
        env_names.update(re.findall(r'\benv\.([A-Z][A-Z0-9_]*)', raw))
        for match in re.findall(r"['\"](/api/[a-zA-Z0-9/_-]+)['\"]", raw):
            apis[match].add(path)
    return {'schema_version': 1, 'baseline_commit': commit, 'tracked_file_count': len(paths),
            'method': 'Git commit contents; direct HTML script/style references only. Dynamic JS/CSS imports require manual review; an HTML file is not proof of a published route.',
            'entrypoints': entries,
            'shared_direct_dependencies': [{'path': dep, 'entrypoints': sorted(pages)} for dep, pages in sorted(uses.items()) if len(pages) > 1],
            'missing_direct_dependencies': missing,
            'literal_api_routes_and_prefixes': [{'route_or_prefix': route, 'sources': sorted(sources)} for route, sources in sorted(apis.items())],
            'server_environment_variable_names_only': sorted(env_names)}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ref', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    result = build(args.ref)
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'commit': result['baseline_commit'], 'entrypoints': len(result['entrypoints']), 'tracked_files': result['tracked_file_count'], 'missing_direct_dependencies': len(result['missing_direct_dependencies'])}))
