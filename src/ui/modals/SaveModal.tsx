import { useState } from 'preact/hooks';
import { actions, dispatch, getState } from '../../app/store';
import { exportFile, importFile } from '../../app/save';
import type { LifeState, Loadout } from '../../core/types';
import { Modal } from '../common';
import { LoadoutEditor } from './LoadoutEditor';
import { sanitizeLoadout } from '../../core/reduce';

export function SaveModal() {
  async function onImport(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const res = await importFile(f);
    if (res.error) actions.toast(res.error);
    else actions.replace(res.life, res.meta);
  }
  return (
    <Modal title="저장" onClose={() => actions.close()}>
      <div class="stack">
        <div class="t9 soft">해가 바뀔 때, 선택에 답한 뒤, 전투가 끝난 뒤 자동으로 저장된다.</div>
        <div class="row">
          <button class="btn gold" onClick={() => actions.saveNow()}>지금 저장</button>
          <button class="btn" onClick={() => exportFile(getState().life, getState().meta)}>파일로 내보내기</button>
          <label class="btn">파일 가져오기<input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImport} /></label>
        </div>
        <div class="hr" />
        <button class="btn" onClick={() => actions.toStart()}>처음 화면으로 (진행은 저장된 채로 남는다)</button>
      </div>
    </Modal>
  );
}

export function LoadoutModal({ s }: { s: LifeState }) {
  const [lo, setLo] = useState<Loadout>(() => sanitizeLoadout(s, s.loadout));
  return (
    <Modal title="편성 (평소 교전)" onClose={() => actions.close()} wide>
      <div class="t9 soft" style={{ marginBottom: 6 }}>평소 교전은 이 편성으로 자동 처리된다. 강적 앞에서는 준비 화면에서 다시 고칠 수 있다.</div>
      <LoadoutEditor s={s} lo={lo} setLo={setLo} />
      <div class="row" style={{ marginTop: 8 }}>
        <button class="btn gold" onClick={() => { dispatch({ type: 'saveLoadout', loadout: lo }); actions.close(); }}>저장하고 닫기</button>
        <button class="btn" onClick={() => actions.close()}>취소</button>
      </div>
    </Modal>
  );
}
