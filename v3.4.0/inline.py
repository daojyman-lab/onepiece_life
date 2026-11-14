"""pixel-skin.css 와 pixel-art.js 를 HTML 안에 넣어 단일 파일로 만든다.
사용: python inline.py   (v3.4.0 폴더에서 실행)"""
import io, re
P = '그랜드_트레저_v3.4.0.html'
s = io.open(P, encoding='utf-8').read()
css = io.open('pixel-skin.css', encoding='utf-8').read()
js = io.open('pixel-art.js', encoding='utf-8').read()
assert '</style>' not in css and '</script>' not in js
style = '<style id="v340-pixel-skin">\n' + css + '\n</style>'
script = '<script id="v340-pixel-art">\n' + js + '\n</script>'
s, n1 = re.subn(r'<link id="v340-pixel-skin"[^>]*>|<style id="v340-pixel-skin">.*?</style>', lambda m: style, s, count=1, flags=re.S)
s, n2 = re.subn(r'<script id="v340-pixel-art"[^>]*>.*?</script>', lambda m: script, s, count=1, flags=re.S)
assert n1 == 1 and n2 == 1, (n1, n2)
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('inlined', len(css), len(js))
