// v5 메뉴: 지금 저장, 내보내기, 가져오기, 도감, 처음으로, 효과음 · 음악. 진행 단추(한 달 진행 같은 것)는 없다.
import { actions, getState, useStore } from '../../app/store';
import { exportFile, importFile } from '../../app/save';
import { Modal } from '../common';

export function MenuModal() {
  const st = useStore();
  async function onImport(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const res = await importFile(f);
    input.value = '';
    if (res.error) actions.toast(res.error);
    else actions.replace(res.life, res.meta);
  }
  return (
    <Modal title="메뉴" onClose={() => actions.close()}>
      <div class="stack">
        <button class="btn block" onClick={() => actions.saveNow()}>지금 저장</button>
        <button class="btn block" onClick={() => exportFile(getState().life, getState().meta)}>내보내기</button>
        <label class="btn block" style={{ textAlign: 'center' }}>가져오기<input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImport} /></label>
        <button class="btn block" onClick={() => actions.open('codex')}>도감</button>
        <button class="btn block" onClick={() => actions.toStart()}>처음으로</button>
        <div class="grid2">
          <button class={`btn ${st.settings.sfx ? 'on' : ''}`} aria-pressed={st.settings.sfx} onClick={() => actions.toggleSound('sfx')}>{st.settings.sfx ? '🔊 효과음 켬' : '🔇 효과음 끔'}</button>
          <button class={`btn ${st.settings.bgm ? 'on' : ''}`} aria-pressed={st.settings.bgm} onClick={() => actions.toggleSound('bgm')}>{st.settings.bgm ? '♪ 음악 켬' : '♪ 음악 끔'}</button>
        </div>
      </div>
    </Modal>
  );
}
