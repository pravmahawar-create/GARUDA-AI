import yt_dlp
import urllib.request
import json

ydl_opts = {'skip_download': True}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info('8yv5kMuk31Y', download=False)
    subs = info.get('automatic_captions', {})
    for lang in ['hi', 'hi-orig', 'en']:
        if lang in subs:
            for item in subs[lang]:
                if item.get('ext') == 'json3':
                    req = urllib.request.urlopen(item['url'])
                    data = json.loads(req.read().decode('utf-8'))
                    for ev in data.get('events', []):
                        segs = ev.get('segs', [])
                        text = ''.join([s.get('utf8', '') for s in segs]).replace('\n', ' ')
                        t_sec = ev.get('tStartMs', 0) / 1000.0
                        print(f"{t_sec:.1f}s: {text.encode('ascii', 'replace').decode('ascii')}")
                    break
            break
