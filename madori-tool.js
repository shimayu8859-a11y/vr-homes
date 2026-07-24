/* madori-tool.js — 間取り図カラーリングツール
   自己完結コンポーネント。<body> の閉じタグ直前に <script src="madori-tool.js"></script>
   として読み込んでください(モーダルHTMLをこのファイルが自分でDOMに追加します) */

(function mctInjectModalHTML(){
  var MCT_MODAL_HTML = `


<!-- ══════════════════════════════════════════════════
     間取り図カラーリングツール モーダル
     ══════════════════════════════════════════════════ -->
<div id="mct-overlay">
  <div class="mct-modal">

    <div class="mct-head">
      <div class="mct-head-left">
        <div class="mct-icon"><i class="ti ti-palette"></i></div>
        <div>
          <h2>間取り図カラーリングツール</h2>
          <div class="mct-sub">VR引越支援システム用データ作成</div>
        </div>
      </div>
      <button class="mct-close-btn" onclick="mctClose()"><i class="ti ti-x"></i></button>
    </div>

    <div class="mct-body">
      <div class="mct-sidebar">

        <!-- 1: upload -->
        <div class="mct-sec">
          <div class="mct-sec-title"><span class="mct-num">1</span>元の写真を読み込む</div>
          <label class="mct-file-drop">
            <input type="file" id="mct-file-input" accept="image/*">
            <div>クリックして写真を選択</div>
            <div class="mct-fname" id="mct-file-name"></div>
          </label>
        </div>

        <!-- 2: real size -->
        <div class="mct-sec">
          <div class="mct-sec-title"><span class="mct-num">2</span>実際のサイズ</div>
          <div class="mct-unit-toggle">
            <button type="button" class="on" id="mct-unit-m">メートル</button>
            <button type="button" id="mct-unit-ft">フィート</button>
          </div>
          <div class="mct-size-row">
            <input class="finput" type="number" id="mct-width" placeholder="幅" min="0.1" step="0.1">
            <span class="mct-x">×</span>
            <input class="finput" type="number" id="mct-height" placeholder="奥行き" min="0.1" step="0.1">
          </div>

          <div class="mct-hint">Unity側(FloorGenerator.cs)の <b>scale</b> 変数に合わせてください(px/m = 1 ÷ scale)</div>
          <div class="mct-scale-row">
            <input class="finput" type="number" id="mct-pxm" value="20" min="1" step="1">
            <span>px / メートル</span>
          </div>

          <div class="flabel" style="margin-top:10px">作業解像度(精密さ)</div>
          <select class="mct-select" id="mct-multiplier">
            <option value="1">1倍(粗い・軽い)</option>
            <option value="2">2倍</option>
            <option value="4" selected>4倍(推奨・高精細)</option>
            <option value="8">8倍(かなり重い)</option>
          </select>
          <div class="mct-hint">画面では高精細に塗れます。書き出すサイズは下の「5」で選べます。</div>

          <button class="btn btn-p" id="mct-create-btn" style="width:100%;justify-content:center;margin-top:12px">キャンバスを作成</button>
        </div>

        <!-- auto wall detection -->
        <div class="mct-sec">
          <div class="mct-sec-title">壁の自動検出(任意)</div>
          <div class="mct-hint">写真の暗い部分を壁として下書きします。<b>壁だけ</b>が対象です。ドア・窓・玄関などはこのあと手動で塗ってください。</div>
          <div class="flabel" style="margin-top:8px">暗さのしきい値</div>
          <div class="mct-range-row">
            <input type="range" id="mct-wall-threshold" min="0" max="255" value="100">
            <div class="mct-val" id="mct-wall-threshold-val">100</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn btn-sm" id="mct-wall-commit" style="flex:1;justify-content:center">黒で確定</button>
            <button class="btn btn-sm" id="mct-wall-clear" style="flex:1;justify-content:center">プレビュー解除</button>
          </div>
        </div>

        <!-- tools -->
        <div class="mct-sec">
          <div class="mct-sec-title"><span class="mct-num">3</span>ツールを選ぶ</div>
          <div class="mct-tool-grid">
            <div class="mct-tool-btn on" data-tool="pen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>
              <span>ペン</span><kbd>B</kbd>
            </div>
            <div class="mct-tool-btn" data-tool="rect">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6" width="16" height="12" rx="1"/></svg>
              <span>四角</span><kbd>R</kbd>
            </div>
            <div class="mct-tool-btn" data-tool="bucket">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11l-8-8-8.5 8.5a2 2 0 000 3L9 22l10-10a1 1 0 000-1z"/><path d="M5 2l13 13"/><circle cx="20" cy="17" r="2"/></svg>
              <span>塗りつぶし</span><kbd>G</kbd>
            </div>
            <div class="mct-tool-btn" data-tool="eraser">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H8l-6-6a2 2 0 010-3l9-9a2 2 0 013 0l7 7a2 2 0 010 3l-7 7"/></svg>
              <span>消しゴム</span><kbd>E</kbd>
            </div>
          </div>
          <div class="flabel" style="margin-top:8px">太さ</div>
          <div class="mct-range-row">
            <input type="range" id="mct-brush-size" min="1" max="20" value="2">
            <div class="mct-val" id="mct-brush-size-val">2px</div>
          </div>
        </div>

        <!-- colors -->
        <div class="mct-sec">
          <div class="mct-sec-title"><span class="mct-num">4</span>色を選んでなぞる</div>
          <div class="mct-palette" id="mct-palette"></div>
          <div class="mct-hint">何も塗らない部分は自動的に<b>白(床)</b>として書き出されます。</div>
        </div>

        <!-- view settings -->
        <div class="mct-sec">
          <div class="mct-sec-title">表示設定</div>
          <div class="mct-toggle-row">元の写真を見せる
            <label class="mct-switch"><input type="checkbox" id="mct-ref-toggle" checked><span class="mct-track"></span></label>
          </div>
          <div class="mct-range-row">
            <input type="range" id="mct-ref-opacity" min="0" max="100" value="70">
            <div class="mct-val" id="mct-ref-opacity-val">70%</div>
          </div>
          <div class="mct-toggle-row">グリッドを表示
            <label class="mct-switch"><input type="checkbox" id="mct-grid-toggle"><span class="mct-track"></span></label>
          </div>
        </div>

        <!-- export size -->
        <div class="mct-sec">
          <div class="mct-sec-title"><span class="mct-num">5</span>書き出しサイズ</div>
          <label class="mct-radio-row">
            <input type="radio" name="mct-export-mode" value="unity" id="mct-export-unity" checked>
            <div><div>Unity用(実寸どおり)</div><div class="mct-radio-sub" id="mct-export-unity-sub">— × — px</div></div>
          </label>
          <label class="mct-radio-row">
            <input type="radio" name="mct-export-mode" value="working" id="mct-export-working">
            <div><div>作業解像度のまま(高精細)</div><div class="mct-radio-sub" id="mct-export-working-sub">— × — px</div></div>
          </label>
          <label class="mct-radio-row">
            <input type="radio" name="mct-export-mode" value="custom" id="mct-export-custom">
            <div>カスタムサイズ</div>
          </label>
          <div class="mct-custom-size">
            <input class="finput" type="number" id="mct-custom-w" placeholder="幅px">
            <span style="color:var(--text-secondary);font-size:12px">×</span>
            <input class="finput" type="number" id="mct-custom-h" placeholder="高さpx">
          </div>
          <div class="mct-hint">縮小するときは、壁などの細い線が消えないように自動で補正されます。</div>
        </div>

        <!-- actions -->
        <div class="mct-sec">
          <div class="mct-sec-title">操作</div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" id="mct-undo-btn" style="flex:1;justify-content:center">元に戻す</button>
            <button class="btn btn-sm" id="mct-clear-btn" style="flex:1;justify-content:center;color:var(--red);border-color:var(--red-border)">全消去</button>
          </div>
          <div class="mct-hint"><b>Ctrl+Z</b> で元に戻せます。<b>+ / -</b> でズーム。</div>
        </div>

      </div>

      <div class="mct-main">
        <div class="mct-canvas-scroll mct-center" id="mct-canvas-scroll">
          <div class="mct-empty" id="mct-empty">
            <div class="mct-emoji">🏠</div>
            <div class="mct-title">まずは間取り写真をアップロード</div>
            <div class="mct-desc">左側で写真を選び、実際のサイズを入力してから「キャンバスを作成」を押してください。</div>
          </div>
          <div class="mct-stack" id="mct-stack" style="display:none">
            <canvas id="mct-ref-canvas"></canvas>
            <canvas id="mct-paint-canvas"></canvas>
            <canvas id="mct-overlay-canvas"></canvas>
            <div class="mct-grid-overlay" id="mct-grid-overlay"></div>
          </div>
        </div>
        <div class="mct-coord" id="mct-coord"></div>
        <div class="mct-zoom" id="mct-zoom" style="display:none">
          <button id="mct-zoom-out">−</button>
          <div class="mct-zlabel" id="mct-zoom-label">100%</div>
          <button id="mct-zoom-in">+</button>
          <button id="mct-zoom-fit" style="font-size:10px">FIT</button>
        </div>
      </div>
    </div>

    <div class="mct-foot">
      <div class="mct-foot-left"><span class="mct-res-badge" id="mct-res-badge">未作成</span></div>
      <div class="mct-foot-right">
        <button class="btn btn-sm" onclick="mctClose()">キャンセル</button>
        <button class="btn btn-sm" id="mct-export-only-btn" disabled><i class="ti ti-download"></i>PNGを書き出す</button>
        <button class="btn btn-p btn-sm" id="mct-confirm-btn" disabled><i class="ti ti-check"></i>決定してフォームに反映</button>
      </div>
    </div>

  </div>
</div>

`;
  function inject(){ document.body.insertAdjacentHTML('beforeend', MCT_MODAL_HTML); }
  if(document.body){ inject(); } else { document.addEventListener('DOMContentLoaded', inject); }
})();


(function(){
  "use strict";

  // ===== 色パレット定義(Unity FloorGenerator.cs の色仕様と一致させること) =====
  const MCT_PALETTE = [
    { key:'wall',     label:'壁',             color:'#000000', shortcut:'1' },
    { key:'floor',    label:'室内床',         color:'#FFFFFF', shortcut:'2' },
    { key:'push',     label:'押し戸ドア',     color:'#FF0000', shortcut:'3' },
    { key:'slide',    label:'引き戸(ふすま)', color:'#00FF00', shortcut:'4' },
    { key:'glass',    label:'ガラス窓',       color:'#0000FF', shortcut:'5' },
    { key:'entrance', label:'玄関段差',       color:'#FFFF00', shortcut:'6' },
    { key:'balcony',  label:'バルコニー床',   color:'#00FFFF', shortcut:'7' },
  ];
  const M_PER_FT = 0.3048;

  // ===== state =====
  let sizeUnit = 'm';
  let resolutionW = 0, resolutionH = 0;   // 作業用キャンバスの解像度
  let unityW = 0, unityH = 0;             // Unity用(実寸どおり)の解像度
  let currentColor = MCT_PALETTE[0].color;
  let currentTool = 'pen';
  let brushSize = 2;
  let zoom = 1;
  let isDrawing = false;
  let lastNativePoint = null;
  let rectStart = null;
  let uploadedImage = null;
  let undoStack = [];
  let wallPreviewMask = null;
  const UNDO_LIMIT = 30;

  // ===== DOM refs =====
  const overlayEl   = document.getElementById('mct-overlay');
  const fileInput    = document.getElementById('mct-file-input');
  const fileNameEl   = document.getElementById('mct-file-name');
  const unitMBtn      = document.getElementById('mct-unit-m');
  const unitFtBtn      = document.getElementById('mct-unit-ft');
  const widthInput    = document.getElementById('mct-width');
  const heightInput   = document.getElementById('mct-height');
  const pxmInput       = document.getElementById('mct-pxm');
  const multiplierSel  = document.getElementById('mct-multiplier');
  const createBtn      = document.getElementById('mct-create-btn');

  const wallThreshold      = document.getElementById('mct-wall-threshold');
  const wallThresholdVal   = document.getElementById('mct-wall-threshold-val');
  const wallCommitBtn      = document.getElementById('mct-wall-commit');
  const wallClearBtn       = document.getElementById('mct-wall-clear');

  const brushSizeEl   = document.getElementById('mct-brush-size');
  const brushSizeVal  = document.getElementById('mct-brush-size-val');
  const paletteEl      = document.getElementById('mct-palette');

  const refToggle      = document.getElementById('mct-ref-toggle');
  const refOpacity     = document.getElementById('mct-ref-opacity');
  const refOpacityVal  = document.getElementById('mct-ref-opacity-val');
  const gridToggle      = document.getElementById('mct-grid-toggle');
  const gridOverlay     = document.getElementById('mct-grid-overlay');

  const undoBtn = document.getElementById('mct-undo-btn');
  const clearBtn = document.getElementById('mct-clear-btn');

  const customWInput = document.getElementById('mct-custom-w');
  const customHInput = document.getElementById('mct-custom-h');

  const canvasScroll = document.getElementById('mct-canvas-scroll');
  const emptyEl        = document.getElementById('mct-empty');
  const stackEl         = document.getElementById('mct-stack');
  const refCanvas        = document.getElementById('mct-ref-canvas');
  const paintCanvas      = document.getElementById('mct-paint-canvas');
  const overlayCanvas    = document.getElementById('mct-overlay-canvas');

  const coordEl  = document.getElementById('mct-coord');
  const zoomEl    = document.getElementById('mct-zoom');
  const zoomLabel = document.getElementById('mct-zoom-label');

  const resBadge        = document.getElementById('mct-res-badge');
  const exportOnlyBtn   = document.getElementById('mct-export-only-btn');
  const confirmBtn      = document.getElementById('mct-confirm-btn');

  const refCtx     = refCanvas.getContext('2d');
  const paintCtx   = paintCanvas.getContext('2d', { willReadFrequently:true });
  const overlayCtx = overlayCanvas.getContext('2d');

  // ===== open / close (フォームのボタンから呼ばれるのでグローバルに公開) =====
  window.mctOpen = function(){
    overlayEl.classList.add('show');
    if(resolutionW) setTimeout(fitZoom, 0);
  };
  window.mctClose = function(){
    overlayEl.classList.remove('show');
  };
  overlayEl.addEventListener('click', (e) => {
    if(e.target === overlayEl) window.mctClose();
  });

  window.mctClearAttachment = function(){
    window.mctAttachedDataURL = null;
    const wrap = document.getElementById('mct-thumb-wrap');
    if(wrap) wrap.style.display = 'none';
  };

  // ===== palette UI =====
  MCT_PALETTE.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'mct-swatch' + (i === 0 ? ' on' : '');
    el.dataset.color = p.color;
    el.innerHTML =
      '<div class="mct-chip" style="background:' + p.color + ';"></div>' +
      '<div class="mct-info"><div class="mct-name">' + p.label + '</div>' +
      '<div class="mct-hex">' + p.color + '</div></div>' +
      '<kbd>' + p.shortcut + '</kbd>';
    el.addEventListener('click', () => selectColor(p.color, el));
    paletteEl.appendChild(el);
  });

  function selectColor(color, el){
    currentColor = color;
    document.querySelectorAll('.mct-swatch').forEach(s => s.classList.remove('on'));
    if(el){ el.classList.add('on'); }
    else{
      const match = [...document.querySelectorAll('.mct-swatch')]
        .find(s => s.dataset.color.toLowerCase() === color.toLowerCase());
      if(match) match.classList.add('on');
    }
  }

  // ===== tool selection =====
  function setTool(tool){
    currentTool = tool;
    document.querySelectorAll('.mct-tool-btn').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
    paintCanvas.style.cursor = (tool === 'bucket') ? 'cell' : 'crosshair';
  }
  document.querySelectorAll('.mct-tool-btn').forEach(b => {
    b.addEventListener('click', () => setTool(b.dataset.tool));
  });

  brushSizeEl.addEventListener('input', () => {
    brushSize = parseInt(brushSizeEl.value, 10);
    brushSizeVal.textContent = brushSize + 'px';
  });

  // ===== unit toggle (m / ft) =====
  function round2(n){ return Math.round(n * 100) / 100; }
  function getRealWidthM(){
    const v = parseFloat(widthInput.value) || 0;
    return sizeUnit === 'ft' ? v * M_PER_FT : v;
  }
  function getRealHeightM(){
    const v = parseFloat(heightInput.value) || 0;
    return sizeUnit === 'ft' ? v * M_PER_FT : v;
  }
  function setUnit(u){
    if(u === sizeUnit) return;
    const wM = getRealWidthM(), hM = getRealHeightM();
    sizeUnit = u;
    if(widthInput.value)  widthInput.value  = round2(sizeUnit === 'ft' ? wM / M_PER_FT : wM);
    if(heightInput.value) heightInput.value = round2(sizeUnit === 'ft' ? hM / M_PER_FT : hM);
    unitMBtn.classList.toggle('on', sizeUnit === 'm');
    unitFtBtn.classList.toggle('on', sizeUnit === 'ft');
  }
  unitMBtn.addEventListener('click', () => setUnit('m'));
  unitFtBtn.addEventListener('click', () => setUnit('ft'));

  function getPxPerMeter(){ return Math.max(1, parseFloat(pxmInput.value) || 20); }
  function unityResW(){ return Math.max(1, Math.round(getRealWidthM()  * getPxPerMeter())); }
  function unityResH(){ return Math.max(1, Math.round(getRealHeightM() * getPxPerMeter())); }

  // ===== file upload =====
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    fileNameEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        if(resolutionW){
          refCtx.clearRect(0, 0, resolutionW, resolutionH);
          refCtx.drawImage(uploadedImage, 0, 0, resolutionW, resolutionH);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // ===== create canvas =====
  createBtn.addEventListener('click', () => {
    const wM = getRealWidthM(), hM = getRealHeightM();
    if(!wM || !hM || wM <= 0 || hM <= 0){
      alert('幅と奥行きを正しく入力してください');
      return;
    }
    if(resolutionW){
      if(!confirm('すでに作業中のデータがあります。キャンバスを作り直すと現在の塗り内容は消えます。続けますか?')) return;
    }

    const mult = parseInt(multiplierSel.value, 10) || 1;
    unityW = unityResW();
    unityH = unityResH();
    const workW = Math.max(1, unityW * mult);
    const workH = Math.max(1, unityH * mult);

    if(workW * workH > 9_000_000){
      if(!confirm('作業解像度がかなり大きくなります(' + workW + ' × ' + workH + 'px)。動作が重くなる可能性があります。続けますか?')) return;
    }

    resolutionW = workW; resolutionH = workH;

    [refCanvas, paintCanvas, overlayCanvas].forEach(c => { c.width = workW; c.height = workH; });
    paintCtx.imageSmoothingEnabled = false;
    refCtx.imageSmoothingEnabled = true;
    overlayCtx.imageSmoothingEnabled = false;

    // 未着色は透明のままにして、下の参照写真が見えるようにする
    paintCtx.clearRect(0, 0, workW, workH);
    wallPreviewMask = null;

    if(uploadedImage){
      refCtx.clearRect(0, 0, workW, workH);
      refCtx.drawImage(uploadedImage, 0, 0, workW, workH);
    }

    undoStack = [];
    pushUndoSnapshot();

    emptyEl.style.display = 'none';
    canvasScroll.classList.remove('mct-center');
    stackEl.style.display = 'block';
    zoomEl.style.display = 'flex';
    exportOnlyBtn.disabled = false;
    confirmBtn.disabled = false;

    updateResUI();
    fitZoom();
    applyRefVisibility();
  });

  function updateResUI(){
    if(!resolutionW){ resBadge.textContent = '未作成'; return; }
    resBadge.textContent = resolutionW + ' × ' + resolutionH + ' px (作業用)';
    document.getElementById('mct-export-unity-sub').textContent   = unityW + ' × ' + unityH + ' px';
    document.getElementById('mct-export-working-sub').textContent = resolutionW + ' × ' + resolutionH + ' px';
  }

  // ===== zoom =====
  function applyZoomToDOM(){
    const wPx = resolutionW * zoom, hPx = resolutionH * zoom;
    stackEl.style.width = wPx + 'px';
    stackEl.style.height = hPx + 'px';
    [refCanvas, paintCanvas, overlayCanvas].forEach(c => {
      c.style.width = wPx + 'px'; c.style.height = hPx + 'px';
    });
    gridOverlay.style.width = wPx + 'px';
    gridOverlay.style.height = hPx + 'px';
    gridOverlay.style.backgroundSize = zoom + 'px ' + zoom + 'px';
    gridOverlay.style.backgroundImage =
      'linear-gradient(to right, rgba(0,0,0,.12) 1px, transparent 1px),' +
      'linear-gradient(to bottom, rgba(0,0,0,.12) 1px, transparent 1px)';
    zoomLabel.textContent = Math.round(zoom * 100) + '%';
  }
  function fitZoom(){
    const availW = canvasScroll.clientWidth - 72;
    const availH = canvasScroll.clientHeight - 72;
    const fit = Math.min(availW / resolutionW, availH / resolutionH, 1);
    zoom = Math.max(0.05, fit);
    applyZoomToDOM();
  }
  document.getElementById('mct-zoom-in').addEventListener('click', () => { zoom = Math.min(zoom * 1.25, 16); applyZoomToDOM(); });
  document.getElementById('mct-zoom-out').addEventListener('click', () => { zoom = Math.max(zoom / 1.25, 0.05); applyZoomToDOM(); });
  document.getElementById('mct-zoom-fit').addEventListener('click', fitZoom);

  // ===== reference visibility =====
  function applyRefVisibility(){
    refCanvas.style.opacity = refToggle.checked ? (refOpacity.value / 100) : 0;
  }
  refToggle.addEventListener('change', applyRefVisibility);
  refOpacity.addEventListener('input', () => {
    refOpacityVal.textContent = refOpacity.value + '%';
    applyRefVisibility();
  });
  gridToggle.addEventListener('change', () => gridOverlay.classList.toggle('show', gridToggle.checked));

  // ===== undo =====
  function pushUndoSnapshot(){
    if(!resolutionW) return;
    try{
      const data = paintCtx.getImageData(0, 0, resolutionW, resolutionH);
      undoStack.push(data);
      if(undoStack.length > UNDO_LIMIT) undoStack.shift();
    }catch(e){ /* ignore */ }
  }
  function undo(){
    if(undoStack.length <= 1) return;
    undoStack.pop();
    paintCtx.putImageData(undoStack[undoStack.length - 1], 0, 0);
  }
  undoBtn.addEventListener('click', undo);

  clearBtn.addEventListener('click', () => {
    if(!resolutionW) return;
    if(!confirm('すべて消去して、写真がそのまま見える状態に戻します。よろしいですか?')) return;
    pushUndoSnapshot();
    paintCtx.clearRect(0, 0, resolutionW, resolutionH);
    overlayCtx.clearRect(0, 0, resolutionW, resolutionH);
    wallPreviewMask = null;
  });

  // ===== coordinate conversion =====
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
  function clientToNative(clientX, clientY){
    const rect = paintCanvas.getBoundingClientRect();
    const nx = Math.floor((clientX - rect.left) / zoom);
    const ny = Math.floor((clientY - rect.top) / zoom);
    return { x: clamp(nx, 0, resolutionW - 1), y: clamp(ny, 0, resolutionH - 1) };
  }

  function stampAt(x, y){
    const half = Math.floor(brushSize / 2);
    paintCtx.fillStyle = (currentTool === 'eraser') ? '#FFFFFF' : currentColor;
    paintCtx.fillRect(x - half, y - half, brushSize, brushSize);
  }
  function stampLine(x0, y0, x1, y1){
    const dx = x1 - x0, dy = y1 - y0;
    const steps = Math.max(1, Math.max(Math.abs(dx), Math.abs(dy)));
    for(let i = 0; i <= steps; i++){
      const t = i / steps;
      stampAt(Math.round(x0 + dx * t), Math.round(y0 + dy * t));
    }
  }

  // ===== flood fill =====
  function floodFill(startX, startY, fillColor){
    const imgData = paintCtx.getImageData(0, 0, resolutionW, resolutionH);
    const data = imgData.data;
    const w = resolutionW, h = resolutionH;
    const idx = (x, y) => (y * w + x) * 4;
    const startIdx = idx(startX, startY);
    const tR = data[startIdx], tG = data[startIdx+1], tB = data[startIdx+2], tA = data[startIdx+3];

    const fr = parseInt(fillColor.slice(1,3), 16);
    const fg = parseInt(fillColor.slice(3,5), 16);
    const fb = parseInt(fillColor.slice(5,7), 16);

    if(tR === fr && tG === fg && tB === fb && tA === 255) return;

    const stack = [[startX, startY]];
    const visited = new Uint8Array(w * h);
    visited[startY * w + startX] = 1;

    while(stack.length){
      const [x, y] = stack.pop();
      const i = idx(x, y);
      data[i] = fr; data[i+1] = fg; data[i+2] = fb; data[i+3] = 255;
      const nb = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
      for(const [nx, ny] of nb){
        if(nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const vi = ny * w + nx;
        if(visited[vi]) continue;
        const ni = idx(nx, ny);
        if(data[ni] === tR && data[ni+1] === tG && data[ni+2] === tB && data[ni+3] === tA){
          visited[vi] = 1;
          stack.push([nx, ny]);
        }
      }
    }
    paintCtx.putImageData(imgData, 0, 0);
  }

  // ===== auto wall detection =====
  function updateWallPreview(threshold){
    if(!resolutionW || !uploadedImage) return;
    const w = resolutionW, h = resolutionH;
    const refData = refCtx.getImageData(0, 0, w, h).data;
    const overlayData = overlayCtx.createImageData(w, h);
    const od = overlayData.data;
    wallPreviewMask = new Uint8Array(w * h);
    for(let p = 0, i = 0; i < refData.length; i += 4, p++){
      const lum = 0.299*refData[i] + 0.587*refData[i+1] + 0.114*refData[i+2];
      if(lum < threshold){
        wallPreviewMask[p] = 1;
        od[i]=255; od[i+1]=0; od[i+2]=150; od[i+3]=150;
      }
    }
    overlayCtx.putImageData(overlayData, 0, 0);
  }
  function commitWallPreview(){
    if(!resolutionW){ alert('先にキャンバスを作成してください'); return; }
    if(!wallPreviewMask){ alert('しきい値スライダーを動かしてプレビューしてから確定してください'); return; }
    pushUndoSnapshot();
    const w = resolutionW, h = resolutionH;
    const paintData = paintCtx.getImageData(0, 0, w, h);
    const pd = paintData.data;
    for(let p = 0, i = 0; i < pd.length; i += 4, p++){
      if(wallPreviewMask[p]){ pd[i]=0; pd[i+1]=0; pd[i+2]=0; pd[i+3]=255; }
    }
    paintCtx.putImageData(paintData, 0, 0);
    overlayCtx.clearRect(0, 0, w, h);
    wallPreviewMask = null;
  }
  function clearWallPreview(){
    if(!resolutionW) return;
    overlayCtx.clearRect(0, 0, resolutionW, resolutionH);
    wallPreviewMask = null;
  }
  wallThreshold.addEventListener('input', () => {
    wallThresholdVal.textContent = wallThreshold.value;
    updateWallPreview(parseInt(wallThreshold.value, 10));
  });
  wallCommitBtn.addEventListener('click', commitWallPreview);
  wallClearBtn.addEventListener('click', clearWallPreview);

  // ===== pointer events =====
  paintCanvas.addEventListener('pointerdown', (e) => {
    if(!resolutionW) return;
    paintCanvas.setPointerCapture(e.pointerId);

    if(wallPreviewMask){
      overlayCtx.clearRect(0, 0, resolutionW, resolutionH);
      wallPreviewMask = null;
    }

    const p = clientToNative(e.clientX, e.clientY);

    if(currentTool === 'pen' || currentTool === 'eraser'){
      pushUndoSnapshot();
      isDrawing = true;
      lastNativePoint = p;
      stampAt(p.x, p.y);
    } else if(currentTool === 'rect'){
      pushUndoSnapshot();
      rectStart = p;
      isDrawing = true;
    } else if(currentTool === 'bucket'){
      pushUndoSnapshot();
      floodFill(p.x, p.y, currentColor);
    }
  });

  paintCanvas.addEventListener('pointermove', (e) => {
    if(!resolutionW) return;
    const p = clientToNative(e.clientX, e.clientY);
    updateCoordReadout(p);
    if(!isDrawing) return;

    if(currentTool === 'pen' || currentTool === 'eraser'){
      if(lastNativePoint) stampLine(lastNativePoint.x, lastNativePoint.y, p.x, p.y);
      lastNativePoint = p;
    } else if(currentTool === 'rect' && rectStart){
      drawRectPreview(rectStart, p);
    }
  });

  function endStroke(e){
    if(!resolutionW) return;
    if(currentTool === 'rect' && rectStart && isDrawing){
      const p = clientToNative(e.clientX, e.clientY);
      commitRect(rectStart, p);
      overlayCtx.clearRect(0, 0, resolutionW, resolutionH);
    }
    isDrawing = false; lastNativePoint = null; rectStart = null;
  }
  paintCanvas.addEventListener('pointerup', endStroke);
  paintCanvas.addEventListener('pointercancel', endStroke);
  paintCanvas.addEventListener('pointerleave', () => { coordEl.style.display = 'none'; });
  paintCanvas.addEventListener('pointerenter', () => { if(resolutionW) coordEl.style.display = 'block'; });

  function drawRectPreview(start, end){
    overlayCtx.clearRect(0, 0, resolutionW, resolutionH);
    const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x) + 1, h = Math.abs(end.y - start.y) + 1;
    overlayCtx.fillStyle = currentColor;
    overlayCtx.globalAlpha = 0.55;
    overlayCtx.fillRect(x, y, w, h);
    overlayCtx.globalAlpha = 1;
    overlayCtx.strokeStyle = '#185FA5';
    overlayCtx.lineWidth = Math.max(1, 1/zoom);
    overlayCtx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function commitRect(start, end){
    const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x) + 1, h = Math.abs(end.y - start.y) + 1;
    paintCtx.fillStyle = (currentTool === 'eraser') ? '#FFFFFF' : currentColor;
    paintCtx.fillRect(x, y, w, h);
  }

  function updateCoordReadout(p){
    const pxm = getPxPerMeter();
    const mx = (p.x / pxm).toFixed(2), my = (p.y / pxm).toFixed(2);
    coordEl.innerHTML = 'X <b>' + p.x + '</b>px (' + mx + 'm) &nbsp; Y <b>' + p.y + '</b>px (' + my + 'm)';
  }

  // ===== export: 特徴を消さない縮小(壁などの細線が消えないようにする) =====
  function downsamplePreserveFeatures(srcCanvas, srcW, srcH, dstW, dstH){
    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently:true });
    const srcData = srcCtx.getImageData(0, 0, srcW, srcH).data;
    const dst = document.createElement('canvas');
    dst.width = dstW; dst.height = dstH;
    const dctx = dst.getContext('2d');
    const dImg = dctx.createImageData(dstW, dstH);
    const dd = dImg.data;
    const scaleX = srcW / dstW, scaleY = srcH / dstH;

    for(let oy = 0; oy < dstH; oy++){
      const sy0 = Math.floor(oy * scaleY), sy1 = Math.max(sy0 + 1, Math.floor((oy + 1) * scaleY));
      for(let ox = 0; ox < dstW; ox++){
        const sx0 = Math.floor(ox * scaleX), sx1 = Math.max(sx0 + 1, Math.floor((ox + 1) * scaleX));
        let chosen = null;
        for(let yy = sy0; yy < sy1 && yy < srcH; yy++){
          for(let xx = sx0; xx < sx1 && xx < srcW; xx++){
            const i = (yy*srcW+xx)*4;
            const r = srcData[i], g = srcData[i+1], b = srcData[i+2];
            if(!(r >= 250 && g >= 250 && b >= 250)){ chosen = [r,g,b]; break; }
          }
          if(chosen) break;
        }
        if(!chosen){
          const cx = Math.min(srcW - 1, sx0), cy = Math.min(srcH - 1, sy0);
          const i = (cy*srcW+cx)*4;
          chosen = [srcData[i], srcData[i+1], srcData[i+2]];
        }
        const di = (oy*dstW+ox)*4;
        dd[di]=chosen[0]; dd[di+1]=chosen[1]; dd[di+2]=chosen[2]; dd[di+3]=255;
      }
    }
    dctx.putImageData(dImg, 0, 0);
    return dst;
  }

  function computeExportCanvas(){
    const composited = document.createElement('canvas');
    composited.width = resolutionW; composited.height = resolutionH;
    const cctx = composited.getContext('2d');
    cctx.imageSmoothingEnabled = false;
    cctx.fillStyle = '#FFFFFF';
    cctx.fillRect(0, 0, resolutionW, resolutionH);
    cctx.drawImage(paintCanvas, 0, 0);

    const modeEl = document.querySelector('input[name="mct-export-mode"]:checked');
    const mode = modeEl ? modeEl.value : 'unity';
    let outW, outH;
    if(mode === 'unity'){ outW = unityW; outH = unityH; }
    else if(mode === 'working'){ outW = resolutionW; outH = resolutionH; }
    else{
      outW = Math.max(1, parseInt(customWInput.value, 10) || resolutionW);
      outH = Math.max(1, parseInt(customHInput.value, 10) || resolutionH);
    }

    if(outW === resolutionW && outH === resolutionH) return composited;

    if(outW >= resolutionW && outH >= resolutionH){
      const up = document.createElement('canvas');
      up.width = outW; up.height = outH;
      const uctx = up.getContext('2d');
      uctx.imageSmoothingEnabled = false;
      uctx.drawImage(composited, 0, 0, outW, outH);
      return up;
    }
    return downsamplePreserveFeatures(composited, resolutionW, resolutionH, outW, outH);
  }

  function downloadCanvas(canvas){
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'madori_color_' + canvas.width + 'x' + canvas.height + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  }

  exportOnlyBtn.addEventListener('click', () => {
    if(!resolutionW) return;
    downloadCanvas(computeExportCanvas());
  });

  confirmBtn.addEventListener('click', () => {
    if(!resolutionW) return;
    const out = computeExportCanvas();
    // ← 自動ダウンロードなし。「PNGを書き出す」ボタンで明示的にDLできる
    const dataURL = out.toDataURL('image/png');
    window.mctAttachedDataURL = dataURL;
    const thumbWrap = document.getElementById('mct-thumb-wrap');
    const thumbImg  = document.getElementById('mct-thumb-img');
    if(thumbImg) thumbImg.src = dataURL;
    if(thumbWrap) thumbWrap.style.display = 'flex';
    window.mctClose();
  });

  // ===== keyboard shortcuts(モーダルが開いているときだけ有効) =====
  window.addEventListener('keydown', (e) => {
    if(!overlayEl.classList.contains('show')) return;
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); undo(); return; }
    const toolKeys = { b:'pen', r:'rect', g:'bucket', e:'eraser' };
    const k = e.key.toLowerCase();
    if(toolKeys[k]){ setTool(toolKeys[k]); return; }
    const colorByShortcut = MCT_PALETTE.find(p => p.shortcut === e.key);
    if(colorByShortcut){ selectColor(colorByShortcut.color); return; }
    if(e.key === '+' || e.key === '='){ zoom = Math.min(zoom * 1.25, 16); applyZoomToDOM(); }
    if(e.key === '-' || e.key === '_'){ zoom = Math.max(zoom / 1.25, 0.05); applyZoomToDOM(); }
  });

  // initial label sync
  brushSizeVal.textContent = brushSize + 'px';
  refOpacityVal.textContent = refOpacity.value + '%';

})();
