import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('readiness',pathlib.Path(__file__).resolve().parents[1]/'readiness.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Readiness(unittest.TestCase):
 def response(self,path,scope,sql=None):
  self.assertIn(scope,['d1','worker'])
  if path.endswith('/query'):
   self.assertEqual(sql,m.SQL)
   return [{'success':True,'results':value} for value in [[{'app':'stannet-dev-b1','environment_id':m.DATABASE,'schema_version':2}],[{'name':'0001_initial.sql'},{'name':'0002_environment_and_indexes.sql'}],[{'users':0}],[{'quick_check':'ok'}],[]]]
  if path=='d1/database/'+m.DATABASE:return {'uuid':m.DATABASE,'name':m.NAME}
  if path.endswith('/deployments'):return {'deployments':[{'id':'synthetic-only'}]}
  if path=='workers/domains':return [{'hostname':'stannet.dev','service':'stannet-dev-portal'}]
  raise RuntimeError('Metadata access blocked: HTTP 403')
 def test_readonly(self):
  data=m.check(self.response);self.assertTrue(data['identity_verified']);self.assertFalse(data['remote_writes']);self.assertEqual(data['users'],0);self.assertIn('plan_verification_blocked',data)
 def test_wrong_id_stops_before_query(self):
  calls=[]
  def wrong(path,scope,sql=None):calls.append(path);return {'uuid':'wrong','name':m.NAME}
  with self.assertRaisesRegex(RuntimeError,'identity mismatch'):m.check(wrong)
  self.assertEqual(len(calls),1)
 def test_no_mutation_or_arbitrary_query_can_be_sent(self):
  for path,sql in [('d1/database',None),('d1/database/'+m.DATABASE+'/query','DELETE FROM dev_users'),('workers/scripts/stannet-landing',None)]:
   with self.assertRaisesRegex(RuntimeError,'allowlist'):m.request(path,'fixture-only',sql)
unittest.main()
