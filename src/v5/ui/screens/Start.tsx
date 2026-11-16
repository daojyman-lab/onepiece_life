// v5 시작 화면: 이어 하기, 새 인생(이름 · 성별만, 나머지는 주사위), 명예의 전당, 도감, 내보내기 · 가져오기, 정보.
import { useEffect, useRef, useState } from 'preact/hooks';
import { drawFlag, FLAG_SIZE } from '../../../ui/pixel/flag';
import { actions, getState, useStore } from '../../app/store';
import { exportFile, importFile } from '../../app/save';
import { fullName } from '../../core/birth';
import { STANDING_NAME } from '../../data/words';
import { Modal } from '../common';
import { CodexBody } from '../modals/CodexModal';
import { ageWord, hallView } from '../view';

/** 바람에 펄럭이는 해적 깃발 (v4 JollyRoger와 같다) */
function JollyRoger() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, t = 0;
    const loop = () => { t++; drawFlag(ctx, 4, reduce ? 0 : t); if (!reduce) raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} class="jolly-roger" width={FLAG_SIZE.w * 4} height={FLAG_SIZE.h * 4} role="img" aria-label="해적 깃발" />;
}

export function Start() {
  const st = useStore();
  const [gender, setGender] = useState<'' | 'm' | 'f'>('');
  const [name, setName] = useState('');
  const cleanName = name.replace(/\s+/g, ' ').trim().slice(0, 10);
  const [show, setShow] = useState<null | 'hall' | 'codex' | 'info'>(null);
  const life = st.life;
  const hall = hallView(st.meta);

  async function onImport(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const res = await importFile(f);
    input.value = '';
    if (res.error) { actions.toast(res.error); return; }
    // 진행 중인 인생을 갈아 끼우기 전에 묻는다 (도감은 물음 없이 통째로 바뀐다)
    if (res.life && getState().life && !confirm('진행 중인 인생을 버리고 가져온 인생으로 바꿀까? (되돌릴 수 없다)')) return;
    actions.replace(res.life, res.meta);
  }

  return (
    <div class="app start-screen">
      <div class="frame frame-pad" style={{ textAlign: 'center', width: '100%' }}>
        <h1 class="game-title">GRAND TREASURE</h1>
        <div class="t9 soft">v5 · 갈래 치는 인생 (개발 중)</div>
        <JollyRoger />

        {life && (
          <div class="paper" style={{ marginBottom: 10 }}>
            <div class="row between">
              <span>진행 중: <b>{fullName(life.hero).trim()}</b> · {ageWord(life.age)} · {STANDING_NAME[life.hero.standing]}</span>
              <button class="btn gold" onClick={() => actions.continueLife()}>이어 하기</button>
            </div>
          </div>
        )}

        <div class="paper stack" style={{ textAlign: 'left' }}>
          <b>새 인생</b>
          <label class="stack t9">이름 <span class="soft">(비우면 무작위 · 10자까지)</span>
            <input type="text" value={name} maxLength={10} placeholder="예: 루카" aria-label="주인공 이름"
              onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </label>
          <label class="stack t9">성별
            <select value={gender} onChange={(e) => setGender((e.target as HTMLSelectElement).value as '' | 'm' | 'f')}>
              <option value="">무작위</option><option value="m">남</option><option value="f">여</option>
            </select>
          </label>
          <div class="t9 soft">어디서, 어떤 집에서, 어떤 몸으로 태어날지는 주사위가 정한다.</div>
          <button class="btn gold block" onClick={() => {
            if (life && !confirm('진행 중인 인생을 버리고 새로 시작할까? (되돌릴 수 없다)')) return;
            actions.newLife({ name: cleanName || undefined, gender: gender || undefined });
          }}>주사위를 굴린다</button>
        </div>

        <div class="row" style={{ justifyContent: 'center', marginTop: 10 }}>
          <button class="btn" onClick={() => setShow('hall')}>명예의 전당 ({hall.length})</button>
          <button class="btn" onClick={() => setShow('codex')}>도감</button>
          <button class="btn" onClick={() => exportFile(getState().life, getState().meta)}>내보내기</button>
          <label class="btn">가져오기<input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImport} /></label>
          <button class="btn" onClick={() => setShow('info')}>정보</button>
        </div>
      </div>

      {show === 'hall' && (
        <Modal title="명예의 전당" onClose={() => setShow(null)}>
          {hall.length === 0 ? <div class="empty">아직 끝난 인생이 없다.</div> : (
            <div class="stack">
              {hall.map((h, i) => (
                <div key={i} class="paper" style={{ textAlign: 'left' }}>
                  <b>{h.name}</b>
                  <div class="t9">{h.persona}</div>
                  <div class="t9">{h.oneLine}</div>
                  <div class="t9 soft">{h.end}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
      {show === 'codex' && <Modal title="도감" onClose={() => setShow(null)} wide><CodexBody meta={st.meta} /></Modal>}
      {show === 'info' && (
        <Modal title="정보" onClose={() => setShow(null)}>
          <div class="scroll">
            「그랜드 트레저」는 원피스 세계관을 빌린 비영리 팬게임이다. 상업적으로 쓰지 않는다.
            {'\n'}원작의 그림과 음원, 시판 게임에서 추출한 그림을 쓰지 않는다. 인물 그림은 모두 코드로 그린 도트다.
            {'\n\n'}저장: 브라우저에 자동 저장된다. 내보내기로 파일에 남기고, 가져오기로 되살릴 수 있다.
            {'\n'}인생이 끝나면 능력치와 돈은 남지 않는다. 골라 본 문, 먹어 본 열매, 만난 인물이 도감에 남는다.
          </div>
        </Modal>
      )}
    </div>
  );
}
