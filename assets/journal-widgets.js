(() => {
  'use strict';

  const cancel = document.querySelector('[data-journal-widget="cancellation"]');
  if (cancel) {
    const scenarios = {
      valid: { lesson: 'scheduled', right: 'reserved', fail: false, reason: '',
        notes: ['요청을 전달합니다.', '권한·수업 상태·수강권의 학생 ID와 지점 정보를 확인했습니다.', '수업을 canceled로, 같은 수강권을 available로 변경했습니다.', '취소 이벤트와 감사 기록을 남기고 완료했습니다.'] },
      already: { lesson: 'canceled', right: 'available', fail: true, reason: '수업이 이미 canceled 상태입니다. 중복 취소 요청을 거절합니다.',
        notes: ['요청을 전달합니다.', 'scheduled 상태가 아니므로 취소할 수 없습니다.'] },
      mismatch: { lesson: 'scheduled', right: 'reserved', fail: true, reason: '수업과 수강권의 학생 ID가 서로 달라 요청을 거절합니다.',
        notes: ['요청을 전달합니다.', '수업과 수강권의 소유자 정보가 일치하지 않습니다.'] }
    };
    const before = ['수업·학생·관련 문서 조회', '클라이언트에서 조건 확인', '관련 문서 변경(트랜잭션 활용 가능)', '요청 경로별 일관성 확인'];
    const after = ['Flutter가 cancel_lesson RPC 호출', '권한·수업·수강권 검증 및 잠금', '동일 수강권 복원과 수업 상태 변경', '취소 이력·감사 로그 기록'];
    const beforeList = cancel.querySelector('[data-cancel-before]');
    const afterList = cancel.querySelector('[data-cancel-after]');
    const lessonEl = cancel.querySelector('[data-cancel-lesson]');
    const rightEl = cancel.querySelector('[data-cancel-right]');
    const stateEl = cancel.querySelector('[data-cancel-state]');
    const reportEl = cancel.querySelector('[data-cancel-report]');
    const progressEl = cancel.querySelector('[data-cancel-progress]');
    const next = cancel.querySelector('[data-cancel-next]');
    const reset = cancel.querySelector('[data-cancel-reset]');
    const buttons = [...cancel.querySelectorAll('[data-cancel-scenario]')];
    let scenario = 'valid', step = 0, stopped = false;
    const fill = (root, names) => {
      root.replaceChildren(...names.map(name => { const li = document.createElement('li'); li.textContent = name; li.dataset.state = 'upcoming'; return li; }));
    };
    function update() {
      const data = scenarios[scenario];
      lessonEl.textContent = scenario === 'valid' && step >= 3 ? 'canceled' : data.lesson;
      rightEl.textContent = scenario === 'valid' && step >= 3 ? 'available' : data.right;
      stateEl.textContent = stopped ? '검증 거절' : (step === 4 ? '처리 완료' : step === 0 ? '요청 전' : '처리 중');
      progressEl.textContent = step + ' / 4';
      next.disabled = stopped || step >= 4;
      for (const list of [beforeList, afterList]) {
        [...list.children].forEach((li, index) => {
          li.dataset.state = index < step ? (stopped && index === step - 1 ? 'failed' : 'done') : 'upcoming';
        });
      }
      if (step === 0) reportEl.textContent = '단계 실행을 누르면 검증 결과에 따라 수업과 수강권 상태가 달라집니다.';
      else if (stopped) reportEl.textContent = data.reason + ' 수업과 수강권 데이터는 변경하지 않습니다.';
      else reportEl.textContent = data.notes[step - 1];
      reportEl.dataset.result = stopped ? 'error' : step === 4 ? 'ok' : '';
    }
    function restart(key) {
      scenario = key || scenario; step = 0; stopped = false;
      fill(beforeList, before);
      fill(afterList, after);
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cancelScenario === scenario)));
      update();
    }
    next.addEventListener('click', () => {
      if (stopped || step >= 4) return;
      step += 1;
      if (step === 2 && scenarios[scenario].fail) stopped = true;
      update();
    });
    reset.addEventListener('click', () => restart());
    buttons.forEach(b => b.addEventListener('click', () => restart(b.dataset.cancelScenario)));
    restart('valid');
  }

  const audit = document.querySelector('[data-journal-widget="audit"]');
  if (audit) {
    const studentEl = audit.querySelector('[data-audit-student]');
    const rightEl = audit.querySelector('[data-audit-right]');
    const report = audit.querySelector('[data-audit-report]');
    const runButton = audit.querySelector('[data-audit-run]');
    const fixId = audit.querySelector('[data-audit-fix-id]');
    const fixRight = audit.querySelector('[data-audit-fix-right]');
    const reset = audit.querySelector('[data-audit-reset]');
    const checks = [...audit.querySelectorAll('[data-audit-check]')];
    const keys = ['count', 'mapping', 'reference', 'business', 'timezone', 'functional'];
    let validId = false, validRight = false, checked = false;
    function evaluate() {
      return { count:true, mapping:validId, reference:validId,
        business:validRight, timezone:true, functional:validId && validRight };
    }
    function redraw(context) {
      studentEl.textContent = validId ? 'u-102' : 'u-999';
      rightEl.textContent = validRight ? '반환' : '사용';
      studentEl.className = checked ? (validId ? 'jw-fixed' : 'jw-bad') : '';
      rightEl.className = checked ? (validRight ? 'jw-fixed' : 'jw-bad') : '';
      const statuses = evaluate();
      checks.forEach((el, index) => {
        const ok = statuses[keys[index]];
        el.dataset.result = checked ? (ok ? 'ok' : 'bad') : '';
        el.querySelector('strong').textContent = checked ? (ok ? '통과' : '불일치') : '검사 전';
      });
      fixId.disabled = !checked || validId;
      fixRight.disabled = !checked || validRight;
      if (!checked) {
        report.textContent = '검사를 실행하기 전에는 수량이 같다는 사실만 확인할 수 있습니다.';
        report.dataset.result = '';
        return;
      }
      const n = Object.values(statuses).filter(Boolean).length;
      report.dataset.result = n === 6 ? 'ok' : 'error';
      if (n === 6) report.textContent = '6개 검증 항목 모두 통과했습니다. 식별자 매핑과 수강권 상태가 원본에 맞고 참조 및 기능 검증도 통과합니다.';
      else {
        const issues = [];
        if (!validId) issues.push('L-02: fb-102에 대응하는 UUID는 u-102인데, 현재 u-999입니다. 이 값은 외래 키 검사도 통과하지 못합니다.');
        if (!validRight) issues.push('L-02: 원본은 수강권 반환인데 변환 결과는 사용 상태입니다.');
        report.textContent = '검증 ' + n + '/6 통과 · 원인 ' + issues.length + '개\n' + issues.join('\n') + (context ? '\n보정한 항목은 즉시 재검증했습니다.' : '');
      }
    }
    runButton.addEventListener('click', () => { checked = true; redraw(false); });
    fixId.addEventListener('click', () => { if (!checked) return; validId = true; redraw(true); });
    fixRight.addEventListener('click', () => { if (!checked) return; validRight = true; redraw(true); });
    reset.addEventListener('click', () => { validId = false; validRight = false; checked = false; redraw(false); });
    redraw(false);
  }
})();