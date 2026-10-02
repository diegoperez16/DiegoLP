"""Prepare the local portfolio playlist. Add files to public/music, then run this script.
Requires ffmpeg and ffprobe. Originals stay intact; web audio, covers and metadata
are generated separately. No external music service is contacted.
"""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/music'
AUDIO = SOURCE / 'web'
COVERS = ROOT / 'public/images/music'
AUDIO.mkdir(parents=True, exist_ok=True)
COVERS.mkdir(parents=True, exist_ok=True)
ORDER = ['about', 'education', 'experience', 'projects', 'contact']
files = [p for p in SOURCE.iterdir() if p.is_file() and p.suffix.lower() in {'.flac', '.mp3', '.wav', '.m4a', '.ogg'}]
files.sort(key=lambda p: (ORDER.index(p.stem) if p.stem in ORDER else len(ORDER), p.name))
tracks = []
for source in files:
    metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(source)]))
    tags = {key.lower(): value for key, value in metadata['format'].get('tags', {}).items()}
    output = AUDIO / f'{source.stem}.mp3'
    if not output.exists() or output.stat().st_mtime < source.stat().st_mtime:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-map', '0:a:0', '-codec:a', 'libmp3lame', '-b:a', '192k', str(output)], check=True)
    artwork = next((s for s in metadata['streams'] if s.get('disposition', {}).get('attached_pic')), None)
    cover = None
    if artwork:
        cover = COVERS / f'{source.stem}.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-map', f"0:{artwork['index']}", '-frames:v', '1', '-vf', 'scale=600:600:force_original_aspect_ratio=decrease', '-update', '1', str(cover)], check=True)
    tracks.append({
        'id': source.stem,
        'title': tags.get('title', source.stem.replace('-', ' ')),
        'artist': tags.get('artist', 'Unknown artist'),
        'album': tags.get('album', 'Diego’s playlist'),
        'audio': f'/music/web/{output.name}',
        'coverUrl': f'/images/music/{cover.name}' if cover else None,
        'durationSeconds': round(float(metadata['format']['duration']), 2),
    })
manifest = ROOT / 'src/data/music.json'
manifest.write_text(json.dumps(tracks, indent=2, ensure_ascii=False) + '\n')
print(f'Prepared {len(tracks)} tracks. Metadata: {manifest}')
