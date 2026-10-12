// SVG-based chart pattern presets as data URLs for trading setups

export const SETUP_CHART_PRESETS = [
  {
    id: 'preset-vwap',
    title: 'Rompimento de VWAP',
    category: 'Fluxo & Médias',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240" style="background:#090d16; font-family:sans-serif;">
        <!-- Grid lines -->
        <line x1="0" y1="40" x2="400" y2="40" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="80" x2="400" y2="80" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="120" x2="400" y2="120" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="160" x2="400" y2="160" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="200" x2="400" y2="200" stroke="#1e293b" stroke-dasharray="3,3"/>
        
        <!-- VWAP Line (Orange Dashed) -->
        <path d="M 10 135 Q 120 138 200 130 T 390 125" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="4,2"/>
        <text x="320" y="120" fill="#f59e0b" font-size="10" font-weight="bold">VWAP D</text>

        <!-- Pre-candles -->
        <!-- Candle 1: Red -->
        <line x1="40" y1="110" x2="40" y2="155" stroke="#f43f5e" stroke-width="1.5"/>
        <rect x="34" y="120" width="12" height="25" fill="#f43f5e" rx="1"/>

        <!-- Candle 2: Doji on VWAP -->
        <line x1="80" y1="120" x2="80" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
        <rect x="74" y="132" width="12" height="6" fill="#94a3b8" rx="1"/>

        <!-- Candle 3: Small Green -->
        <line x1="120" y1="125" x2="120" y2="148" stroke="#10b981" stroke-width="1.5"/>
        <rect x="114" y="128" width="12" height="15" fill="#10b981" rx="1"/>

        <!-- Candle 4: Pullback Red testing VWAP -->
        <line x1="160" y1="125" x2="160" y2="150" stroke="#f43f5e" stroke-width="1.5"/>
        <rect x="154" y="129" width="12" height="14" fill="#f43f5e" rx="1"/>

        <!-- BREAKOUT CANDLE 5: Big Green Breakout above VWAP -->
        <line x1="210" y1="75" x2="210" y2="145" stroke="#10b981" stroke-width="2"/>
        <rect x="202" y="85" width="16" height="52" fill="#10b981" stroke="#34d399" stroke-width="1.5" rx="2"/>

        <!-- BUY ENTRY ARROW -->
        <path d="M 235 90 L 255 90 L 245 80 Z" fill="#38bdf8"/>
        <line x1="255" y1="90" x2="275" y2="90" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="280" y="93" fill="#38bdf8" font-size="10" font-weight="bold">ENTRADA (Compra)</text>

        <!-- Candle 6: Follow-through Green -->
        <line x1="260" y1="50" x2="260" y2="95" stroke="#10b981" stroke-width="1.5"/>
        <rect x="254" y="55" width="12" height="30" fill="#10b981" rx="1"/>

        <!-- Candle 7: Target Reached -->
        <line x1="300" y1="35" x2="300" y2="70" stroke="#10b981" stroke-width="1.5"/>
        <rect x="294" y="40" width="12" height="22" fill="#10b981" rx="1"/>

        <!-- Target Target Line -->
        <line x1="210" y1="45" x2="380" y2="45" stroke="#34d399" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="325" y="40" fill="#34d399" font-size="9" font-weight="bold">ALVO GAIN</text>

        <!-- Stop Line -->
        <line x1="190" y1="148" x2="270" y2="148" stroke="#f43f5e" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="215" y="162" fill="#f43f5e" font-size="9">STOP LOSS (Abaixo da VWAP)</text>

        <!-- Watermark / Title -->
        <rect x="8" y="8" width="135" height="20" fill="#0f172a" rx="4" stroke="#334155"/>
        <text x="14" y="22" fill="#38bdf8" font-size="10" font-weight="bold">⚡ Rompimento de VWAP</text>
      </svg>
    `)}`
  },
  {
    id: 'preset-91',
    title: '9.1 Larry Williams',
    category: 'Médias Móveis',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240" style="background:#090d16; font-family:sans-serif;">
        <!-- Grid -->
        <line x1="0" y1="50" x2="400" y2="50" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="100" x2="400" y2="100" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="150" x2="400" y2="150" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="200" x2="400" y2="200" stroke="#1e293b" stroke-dasharray="3,3"/>

        <!-- MME 9 line curving upwards -->
        <path d="M 15 175 Q 110 185 180 160 T 385 70" fill="none" stroke="#3b82f6" stroke-width="3"/>
        <text x="325" y="65" fill="#60a5fa" font-size="10" font-weight="bold">MME 9 virando ↑</text>

        <!-- Downward candles before reversal -->
        <line x1="45" y1="130" x2="45" y2="170" stroke="#f43f5e" stroke-width="1.5"/>
        <rect x="39" y="140" width="12" height="22" fill="#f43f5e" rx="1"/>

        <line x1="85" y1="150" x2="85" y2="190" stroke="#f43f5e" stroke-width="1.5"/>
        <rect x="79" y="160" width="12" height="20" fill="#f43f5e" rx="1"/>

        <!-- Trigger Candle: turns MMA 9 up -->
        <line x1="140" y1="140" x2="140" y2="185" stroke="#10b981" stroke-width="2"/>
        <rect x="133" y="148" width="14" height="26" fill="#10b981" stroke="#34d399" stroke-width="1" rx="1"/>

        <!-- Breakout Candle triggering entry -->
        <line x1="195" y1="110" x2="195" y2="160" stroke="#10b981" stroke-width="2"/>
        <rect x="187" y="118" width="16" height="34" fill="#10b981" stroke="#34d399" stroke-width="1.5" rx="1"/>

        <!-- Gatilho line -->
        <line x1="133" y1="148" x2="230" y2="148" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2"/>
        <text x="210" y="140" fill="#38bdf8" font-size="9" font-weight="bold">Gatilho (Máxima do candle anterior)</text>

        <!-- Follow through -->
        <line x1="250" y1="80" x2="250" y2="125" stroke="#10b981" stroke-width="1.5"/>
        <rect x="244" y="88" width="12" height="28" fill="#10b981" rx="1"/>

        <line x1="300" y1="60" x2="300" y2="100" stroke="#10b981" stroke-width="1.5"/>
        <rect x="294" y="65" width="12" height="25" fill="#10b981" rx="1"/>

        <!-- Stop loss indicator -->
        <line x1="125" y1="188" x2="175" y2="188" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="110" y="202" fill="#f43f5e" font-size="9">Stop (Mínima do candle de virada)</text>

        <rect x="8" y="8" width="140" height="20" fill="#0f172a" rx="4" stroke="#334155"/>
        <text x="14" y="22" fill="#60a5fa" font-size="10" font-weight="bold">📈 9.1 Larry Williams (MME 9)</text>
      </svg>
    `)}`
  },
  {
    id: 'preset-elefante',
    title: 'Barra Elefante (Oliver Velez)',
    category: 'Price Action',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240" style="background:#090d16; font-family:sans-serif;">
        <!-- Grid -->
        <line x1="0" y1="45" x2="400" y2="45" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="90" x2="400" y2="90" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="135" x2="400" y2="135" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="180" x2="400" y2="180" stroke="#1e293b" stroke-dasharray="3,3"/>

        <!-- Consolidation small candles -->
        <rect x="30" y="140" width="10" height="15" fill="#94a3b8" rx="1"/>
        <line x1="35" y1="135" x2="35" y2="160" stroke="#94a3b8"/>

        <rect x="55" y="142" width="10" height="12" fill="#f43f5e" rx="1"/>
        <line x1="60" y1="138" x2="60" y2="158" stroke="#f43f5e"/>

        <rect x="80" y="138" width="10" height="14" fill="#10b981" rx="1"/>
        <line x1="85" y1="132" x2="85" y2="156" stroke="#10b981"/>

        <!-- GIANT ELEPHANT BAR -->
        <line x1="140" y1="55" x2="140" y2="175" stroke="#10b981" stroke-width="2.5"/>
        <rect x="126" y="65" width="28" height="100" fill="#10b981" stroke="#34d399" stroke-width="2" rx="2"/>

        <text x="165" y="105" fill="#34d399" font-size="11" font-weight="bold">Barra Elefante 🐘</text>
        <text x="165" y="120" fill="#94a3b8" font-size="9">Corpo amplo sem pavios longos</text>

        <!-- Volume bar for elephant bar -->
        <rect x="128" y="195" width="24" height="40" fill="#10b981" opacity="0.9" rx="1"/>
        <text x="160" y="215" fill="#34d399" font-size="9" font-weight="bold">Alto Volume</text>

        <!-- Small volume bars before -->
        <rect x="32" y="222" width="8" height="13" fill="#64748b" opacity="0.6"/>
        <rect x="57" y="225" width="8" height="10" fill="#64748b" opacity="0.6"/>
        <rect x="82" y="220" width="8" height="15" fill="#64748b" opacity="0.6"/>

        <!-- Follow-through candles -->
        <line x1="210" y1="40" x2="210" y2="80" stroke="#10b981" stroke-width="1.5"/>
        <rect x="204" y="45" width="12" height="25" fill="#10b981" rx="1"/>

        <line x1="250" y1="30" x2="250" y2="65" stroke="#10b981" stroke-width="1.5"/>
        <rect x="244" y="32" width="12" height="20" fill="#10b981" rx="1"/>

        <!-- Stop loss at bottom of Elephant bar -->
        <line x1="120" y1="172" x2="200" y2="172" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="3,2"/>
        <text x="155" y="185" fill="#f43f5e" font-size="9">Stop na mínima da barra</text>

        <rect x="8" y="8" width="165" height="20" fill="#0f172a" rx="4" stroke="#334155"/>
        <text x="14" y="22" fill="#a78bfa" font-size="10" font-weight="bold">🐘 Barra Elefante (Oliver Velez)</text>
      </svg>
    `)}`
  },
  {
    id: 'preset-pullback',
    title: 'Pullback na Média Móvel (MM20)',
    category: 'Tendência',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240" style="background:#090d16; font-family:sans-serif;">
        <!-- Grid -->
        <line x1="0" y1="50" x2="400" y2="50" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="100" x2="400" y2="100" stroke="#1e293b" stroke-dasharray="3,3"/>
        <line x1="0" y1="150" x2="400" y2="150" stroke="#1e293b" stroke-dasharray="3,3"/>

        <!-- MM20 Line -->
        <path d="M 20 180 Q 150 170 230 140 T 385 60" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
        <text x="325" y="55" fill="#38bdf8" font-size="10" font-weight="bold">MM 20 Tendência</text>

        <!-- Wave 1 up -->
        <rect x="50" y="110" width="12" height="30" fill="#10b981" rx="1"/>
        <rect x="85" y="90" width="12" height="35" fill="#10b981" rx="1"/>

        <!-- Pullback candles down to MM20 -->
        <rect x="130" y="105" width="10" height="20" fill="#f43f5e" rx="1"/>
        <rect x="160" y="125" width="10" height="22" fill="#f43f5e" rx="1"/>

        <!-- Touch MM20 with Hammer / Reversal candle -->
        <line x1="210" y1="120" x2="210" y2="155" stroke="#10b981" stroke-width="2"/>
        <rect x="204" y="122" width="12" height="12" fill="#10b981" stroke="#34d399" rx="1"/>

        <path d="M 225 125 L 245 125 L 235 115 Z" fill="#34d399"/>
        <text x="250" y="127" fill="#34d399" font-size="9" font-weight="bold">Gatilho de Compra</text>

        <!-- Wave 2 up -->
        <rect x="250" y="70" width="14" height="40" fill="#10b981" rx="1"/>
        <rect x="290" y="45" width="14" height="35" fill="#10b981" rx="1"/>

        <rect x="8" y="8" width="175" height="20" fill="#0f172a" rx="4" stroke="#334155"/>
        <text x="14" y="22" fill="#38bdf8" font-size="10" font-weight="bold">🔄 Pullback na Média (MM20)</text>
      </svg>
    `)}`
  }
];
