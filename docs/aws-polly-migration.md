# StanNet Voice — AWS Polly migration (opt-in)

This change is a staged replacement for the Azure Speech backend of `stannet.space`.
**Do not switch production until AWS/Cloudflare credentials, billing protection, and smoke tests are ready.**
The default behavior remains Azure. The Cloudflare Worker keeps the existing frontend contract and URLs.

## Architecture

- `/api/speech` accepts the existing GET/POST parameters (`text`, `lang`, `voice`, `purpose`). Existing Azure voice IDs are mapped server-side to Polly neural voice IDs.
- `/api/speech/test` sends a tiny Danish `Hej` synthesis and returns diagnostic metadata (not audio).
- `/api/speech/status` reports provider/region/configuration without making a paid synthesis request.
- `/api/radio/voice`, radio bulletins and jingles use the same feature flag. Radio scripts are chunked to stay within Polly's per-request limit.
- AWS Signature Version 4 is generated **only inside the Cloudflare Worker**. Credentials never go to the browser, GitHub, or response body.
- Existing PDF Tutor audiobook, Danish/English Academies, and StanNet AI continue calling `/api/speech` unchanged.

## AWS setup

1. In the AWS Console select **Europe (Spain) — eu-south-2** for Amazon Polly.
   The EC2 radio instance can stay in Stockholm; AWS services need not use the same region.
   Neural Polly voices are not currently listed for Stockholm.
2. Open Amazon Polly > Text-to-Speech and try the **Neural** engine:
   Danish `Sofie`, Spanish (Spain) `Lucia` or `Sergio`, British `Amy` or `Brian`.
3. Create a **dedicated least-privilege IAM principal**, not root.
   An example policy (use only for this dedicated app) is:
   
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["polly:SynthesizeSpeech"],
       "Resource": "*",
       "Condition": {"StringEquals": {"aws:RequestedRegion": "eu-south-2"}}
     }]
   }
   ```
   
   For an external Worker requiring a long-lived key, use an isolated IAM user/credential.
   Prefer short-lived credentials/rotation where available.
4. In **Cloudflare > Workers & Pages > stannet-landing > Settings > Variables and Secrets**, add:
   - **Secret** `AWS_ACCESS_KEY_ID` (IAM access key ID)
   - **Secret** `AWS_SECRET_ACCESS_KEY` (IAM secret)
   - **Variable** `AWS_POLLY_REGION=eu-south-2`
   - **Variable** `RADIO_POLLY_VOICE=Sergio` (or `Lucia`)
   - **Variable** `SPEECH_PROVIDER=polly` **only at cutover time**

   Do not put access keys in `wrangler.jsonc`, browser code, GitHub issues, or chat.
   Review that `keep_vars` preserves dashboard secrets on deployment.

## Before enabling

- Establish Cloudflare WAF/rate limiting for `/api/speech`, `/api/speech/test`, `/api/radio/voice` and radio generated-audio routes. Endpoints are public and each uncached generation costs money.
- Create an AWS **Budget** with email alerts. IAM restrictions do not cap AWS billing.
- Verify the GitHub CI workflow, Cloudflare Worker deployment and smoke tests.
- Validate Polly in the configured region before moving *any* traffic.

## Smoke tests

1. Check `https://stannet.space/api/speech/status` — `provider` should be `amazon-polly`, `configured` true after cutover.
2. Check `https://stannet.space/api/speech/test` — should return `ok: true`, `voice: Sofie`, positive byte length.
3. Open PDF Tutor and read a PDF for several minutes; verify chunk continuation, pause/resume and voices.
4. Test Danish and British/American English pronunciation, Spanish, and a StanNet AI voice response.
5. Test Radio short jingle and long bulletin on Windows, Android/iOS browsers. Long MP3 scripts are currently concatenated from separate Polly chunks; **verify playback across every boundary**. If any player stops at a boundary, keep radio migration blocked until using an audio-repackaging pipeline.
6. Verify AWS usage/costs and 429/rate limiting behavior under normal and repeated requests.

## Rollback

Change the Cloudflare `SPEECH_PROVIDER` variable back to `azure` (or remove it);
no frontend changes or data migration are needed. This only selects the previous
Azure path; it does **not** repair Azure 401 auth errors. If AWS credentials must
be revoked, deactivate the IAM key immediately and remove the Worker secrets.

## Tests

`node --test tests/aws-polly.test.mjs`

Unit tests validate legacy voice mapping, text chunking and AWS SigV4 signing.
They do not prove that the AWS account has the right policies, credit, or voice availability.
