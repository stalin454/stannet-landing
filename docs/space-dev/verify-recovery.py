#!/usr/bin/env python3
"""Restore a fixed source snapshot into an isolated temp directory and verify every blob."""
import argparse
import hashlib
import json
import os
import subprocess
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
def git(*args, **kwargs):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], **kwargs)

def verify(ref, output):
    commit = git('rev-parse', '--verify', ref + '^{commit}').decode().strip()
    entries = git('ls-tree', '-rz', commit).split(b'\0')
    with tempfile.TemporaryDirectory(prefix='stannet-recovery-') as tmp:
        archive = Path(tmp) / 'source.tar.gz'
        git('archive', '--format=tar.gz', '-o', str(archive), commit)
        archive_hash = hashlib.sha256(archive.read_bytes()).hexdigest()
        restored = Path(tmp) / 'restored'
        restored.mkdir()
        with tarfile.open(archive) as tar:
            tar.extractall(restored, filter='data')
        verified = 0
        for entry in entries:
            if not entry:
                continue
            info, raw_path = entry.split(b'\t', 1)
            mode, kind, expected = info.decode().split()
            path = raw_path.decode()
            if kind != 'blob':
                raise RuntimeError('Unsupported Git entry: ' + path)
            file = restored / path
            content = os.readlink(file).encode() if mode == '120000' else file.read_bytes()
            actual = git('hash-object', '--stdin', input=content).decode().strip()
            if actual != expected:
                raise RuntimeError('Restored content differs: ' + path)
            if mode == '100755' and not os.access(file, os.X_OK):
                raise RuntimeError('Executable mode lost: ' + path)
            verified += 1
        # Only additions under docs/space-dev are allowed for this phase.
        changes = git('diff', '--name-status', commit, 'HEAD').decode().splitlines()
        for change in changes:
            status, path = change.split('\t', 1)
            if status != 'A' or not path.startswith('docs/space-dev/'):
                raise RuntimeError('Existing or runtime file changed: ' + change)
        tracked_dirty = git('diff', '--name-only', 'HEAD').decode().splitlines()
        if tracked_dirty:
            raise RuntimeError('Uncommitted tracked changes prevent integrity proof')
        result = {'baseline_commit': commit, 'git_tree': git('rev-parse', commit + '^{tree}').decode().strip(),
                  'archive_sha256': archive_hash, 'restored_and_blob_verified': verified,
                  'executable_modes_verified': True, 'existing_tracked_files_unchanged': True,
                  'scope': 'Tracked source only. No external database, object storage, secrets, DNS or VPS restore is claimed.',
                  'status': 'PASS'}
        Path(output).write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ref', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    verify(args.ref, args.output)
