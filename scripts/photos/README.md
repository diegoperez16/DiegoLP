# Photo cut-outs

`cutout.swift` removes a photo's background with Apple's on-device Vision framework (macOS 14+, no
downloads, no accounts). It reads JPEG, PNG and HEIC, honours orientation, and writes a transparent PNG.

```sh
swiftc -O -o /tmp/cutout scripts/photos/cutout.swift
/tmp/cutout ~/Downloads/photo.HEIC public/images/me/photo.png
```

Trim the empty margins and shrink for the web afterwards, for example with Pillow:

```sh
python3 -c "from PIL import Image; im=Image.open('public/images/me/photo.png'); im=im.crop(im.getchannel('A').getbbox()); im.thumbnail((1000,1000)); im.save('public/images/me/photo.png', optimize=True)"
```

The "sticker" look on /me.html (white outline + shadow) is CSS, see `.me-sticker` in `src/pages/MePage.css`.
