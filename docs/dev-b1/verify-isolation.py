#!/usr/bin/env python3
"""Prove existing files unchanged (except an additive asset exclusion), restore B1 source baseline."""
import hashlib,json,subprocess,tarfile,tempfile,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASE='44ee2b8fcd24f5ca04258f7d9662cc2b4cc4db1c'
def git(*args,**kw):return subprocess.check_output(['git','-C',str(ROOT),*args],**kw)
try:
 git('cat-file','-e',BASE+'^{commit}')
except subprocess.CalledProcessError:
 # GitHub checkout is shallow by default; only fetch the exact known baseline.
 subprocess.check_call(['git','-C',str(ROOT),'fetch','--depth=1','origin',BASE])
paths=git('ls-tree','-r','--name-only',BASE).decode().splitlines()
for path in paths:
 expected=git('show',BASE+':'+path)
 actual=(ROOT/path).read_bytes()
 if path=='.assetsignore':
  assert actual==expected+b'\n# Isolated Dev B1 server, private lessons, tests and configuration\napps/dev-b1/\n'
 else:assert actual==expected,'Existing file changed: '+path
assert b'apps/dev-b1/' in (ROOT/'.assetsignore').read_bytes()
with tempfile.TemporaryDirectory(prefix='stannet-b1-source-') as folder:
 archive=Path(folder)/'source.tar.gz';git('archive','--format=tar.gz','-o',str(archive),BASE)
 restored=Path(folder)/'restored';restored.mkdir()
 with tarfile.open(archive) as stream:stream.extractall(restored,filter='data')
 for path in paths:assert (restored/path).read_bytes()==git('show',BASE+':'+path),'Recovery differs: '+path
 result={'baseline':BASE,'verified_existing_files':len(paths),'only_existing_change':'Add apps/dev-b1/ exclusion to .assetsignore','restored_files':len(paths),'source_archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'external_production_resources_written':False,'result':'PASS'}
 print(json.dumps(result))
