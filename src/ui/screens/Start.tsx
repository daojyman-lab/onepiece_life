import { useState } from 'preact/hooks';
import { actions, getState, useStore } from '../../app/store';
import { exportFile, importFile } from '../../app/save';
import { HOMETOWNS, SURNAMES } from '../../data/births';
import { FRUIT_BY_ID } from '../../data/fruits';
import { Face, Modal, ROUTE_NAMES } from '../common';
import { CodexBody } from '../modals/CodexModal';

export function Start() {
  const st = useStore();
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState<'' | 'm' | 'f'>('');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const sur = SURNAMES.find((x) => x.name === surname);
  const cleanName = name.replace(/\s+/g, ' ').trim().slice(0, 10);
  const [show, setShow] = useState<null | 'hall' | 'codex' | 'info'>(null);
  const life = st.life;

  async function onImport(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const res = await importFile(f);
    if (res.error) actions.toast(res.error);
    else actions.replace(res.life, res.meta);
  }

  return (
    <div class="app" style={{ maxWidth: 640 }}>
      <div class="frame frame-pad" style={{ textAlign: 'center', marginTop: 24 }}>
        <div class="en" style={{ color: 'var(--wood-d)', fontSize: 11 }}>GRAND TREASURE</div>
        <div class="t30" style={{ color: 'var(--gold)', textShadow: '3px 3px 0 var(--wood-dd)', margin: '6px 0' }}>그랜드 트레저</div>
        <div class="t9 soft">v4.0.0 · 원피스 세계관 비영리 팬게임 · 한 사람의 일생을 따라가는 항해</div>
        <div class="row" style={{ justifyContent: 'center', margin: '12px 0' }}>
          <Face who={{ key: 'title-a', age: 8, faction: 'civil', gender: 'm' }} size="big" />
          <Face who={{ key: 'title-b', age: 30, faction: 'pirate', gender: 'f' }} size="big" />
          <Face who={{ key: 'title-c', age: 40, faction: 'marine', gender: 'm' }} size="big" />
        </div>

        {life && (
          <div class="paper" style={{ marginBottom: 10 }}>
            <div class="row between">
              <span>진행 중: <b>{life.hero.surname} {life.hero.name}</b> · {life.hero.age}세 · {ROUTE_NAMES[life.hero.route]}</span>
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
          <div class="grid2">
            <label class="stack t9">성씨
              <select value={surname} onChange={(e) => setSurname((e.target as HTMLSelectElement).value)}>
                <option value="">무작위</option>
                <optgroup label="평범한 집안">{SURNAMES.filter((x) => x.kind === 'common').map((x) => <option value={x.name}>{x.name} — {x.lore}</option>)}</optgroup>
                <optgroup label="이스트 블루의 이름난 집안">{SURNAMES.filter((x) => x.kind === 'local').map((x) => <option value={x.name}>{x.name}{x.d ? ' (D)' : ''} — {x.lore}</option>)}</optgroup>
                <optgroup label="희귀한 성씨 (고아로 태어난다)">{SURNAMES.filter((x) => x.kind === 'rare').map((x) => <option value={x.name}>{x.name}{x.d ? ' (D)' : ''} — {x.lore}</option>)}</optgroup>
              </select>
            </label>
            <label class="stack t9">성별{sur && sur.gender !== 'any' ? <span class="soft"> ({sur.name} 가문은 {sur.gender === 'f' ? '여성' : '남성'}만)</span> : null}
              <select value={gender} disabled={!!sur && sur.gender !== 'any'} onChange={(e) => setGender((e.target as HTMLSelectElement).value as '' | 'm' | 'f')}>
                <option value="">무작위</option><option value="m">남성</option><option value="f">여성</option>
              </select>
            </label>
          </div>
          <label class="stack t9">고향{sur?.kind === 'local' ? <span class="soft"> ({sur.name} 집안은 {sur.homes!.join(' · ')})</span> : sur?.kind === 'rare' ? <span class="soft"> (이 마을 바닷가에서 거둬진다)</span> : null}
            <select value={place} onChange={(e) => setPlace((e.target as HTMLSelectElement).value)}>
              <option value="">무작위</option>
              {HOMETOWNS.filter((h) => sur?.kind !== 'local' || sur.homes!.includes(h.name)).map((h) => <option value={h.name}>{h.name} — {h.text}</option>)}
            </select>
          </label>
          <button class="btn gold block" onClick={() => {
            if (life && !confirm('진행 중인 인생을 버리고 새로 시작할까? (되돌릴 수 없다)')) return;
            actions.newLife({ surname: surname || undefined, gender: gender || undefined, name: cleanName || undefined, place: place && (sur?.kind !== 'local' || sur.homes!.includes(place)) ? place : undefined });
          }}>
            {life ? '새 인생 시작 (지금 인생을 버린다)' : '새 인생 시작'}{cleanName ? ` — ${surname || '?'} ${cleanName}` : ''}
          </button>
        </div>

        <div class="row" style={{ justifyContent: 'center', marginTop: 10 }}>
          <button class="btn" onClick={() => setShow('hall')}>명예의 전당 ({st.meta.hall.length})</button>
          <button class="btn" onClick={() => setShow('codex')}>도감</button>
          <button class="btn" onClick={() => exportFile(getState().life, getState().meta)}>내보내기</button>
          <label class="btn">가져오기<input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImport} /></label>
          <button class="btn" onClick={() => setShow('info')}>정보</button>
        </div>
      </div>

      {show === 'hall' && (
        <Modal title="명예의 전당" onClose={() => setShow(null)}>
          {st.meta.hall.length === 0 ? <div class="empty">아직 끝난 인생이 없다.</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table class="px">
                <thead><tr><th>이름</th><th>길</th><th class="num">나이</th><th class="num">해역</th><th class="num">명성</th><th>열매</th><th>마지막</th></tr></thead>
                <tbody>
                  {st.meta.hall.map((h) => (
                    <tr><td>{h.name}</td><td>{ROUTE_NAMES[h.route]}</td><td class="num">{h.ageAtEnd}</td><td class="num">{h.stage}</td>
                      <td class="num">{h.fame.toLocaleString('ko-KR')}</td><td>{h.fruit ? FRUIT_BY_ID[h.fruit]?.name : '—'}</td><td>{h.cause}</td></tr>
                  ))}
                </tbody>
              </table>
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
            {'\n'}인생이 끝나면 능력치와 물건은 남지 않는다. 먹어 본 열매, 만난 인물, 열어 본 기술이 도감에 남는다.
          </div>
        </Modal>
      )}
    </div>
  );
}
