# StanNet Radio · Stage 8
# Autonomous Broadcast Director -> Liquidsoap -> Icecast

settings.log.level := 3

director_url = environment.get(default="http://director:8788/next", "RADIO_DIRECTOR_URL")

def next_request()
  response = http.get(timeout=8.0, director_url)
  uri = string.trim(response)
  if response.status_code >= 200 and response.status_code < 300 and uri != "" then
    request.create(uri)
  else
    null
  end
end

program = request.dynamic(prefetch=1, next_request)
radio = mksafe(program)

output.icecast(
  %mp3(bitrate=128, stereo=true),
  host="icecast",
  port=8000,
  password=environment.get("ICECAST_SOURCE_PASSWORD"),
  mount="/stannet.mp3",
  name="StanNet Radio",
  description="Music · Tech · Cyber · AI",
  genre="Electronic, Tech, Cybersecurity, AI",
  url="https://www.stannet.space/pages/radio.html",
  public=false,
  radio
)
