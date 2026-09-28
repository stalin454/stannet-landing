# StanNet Radio · Stage 7
# Continuous rights-safe music stream. Scheduled spoken inserts are added in Stage 8.

settings.log.level := 3

music = playlist(mode="randomize", reload_mode="watch", "/music")
radio = mksafe(music)

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
