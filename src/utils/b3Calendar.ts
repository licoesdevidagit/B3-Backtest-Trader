// B3 (Brasil, Bolsa, Balcão) Holiday and Trading Day Calculations

export interface B3DayStatus {
  isTradingDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  isPartialDay?: boolean; // ex: Quarta-feira de Cinzas (abertura às 13h)
  holidayName?: string;
  holidayDescription?: string;
}

// Meeus/Jones/Butcher algorithm to calculate Easter Sunday for any Gregorian year
function getEaster(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// Helper to add days to a date
function addDays(year: number, month: number, day: number, offsetDays: number): { month: number; day: number } {
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Returns B3 trading status for a given year, month (1-12) and day (1-31).
 */
export function getB3DayStatus(year: number, month: number, day: number): B3DayStatus {
  const dateObj = new Date(year, month - 1, day);
  const weekday = dateObj.getDay(); // 0 = Domingo, 6 = Sábado
  const isWeekend = weekday === 0 || weekday === 6;

  // 1. Mobile holidays based on Easter
  const easter = getEaster(year);
  
  // Carnaval (Segunda e Terça)
  const carnavalMon = addDays(year, easter.month, easter.day, -48);
  const carnavalTue = addDays(year, easter.month, easter.day, -47);
  // Quarta-feira de Cinzas
  const cinzasWed = addDays(year, easter.month, easter.day, -46);
  // Sexta-feira Santa / Paixão de Cristo
  const goodFriday = addDays(year, easter.month, easter.day, -2);
  // Corpus Christi
  const corpusChristi = addDays(year, easter.month, easter.day, 60);

  // Check mobile holidays
  if (month === carnavalMon.month && day === carnavalMon.day) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Segunda-feira de Carnaval',
      holidayDescription: 'Feriado B3 · Não há negociação nos mercados da B3.',
    };
  }

  if (month === carnavalTue.month && day === carnavalTue.day) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Terça-feira de Carnaval',
      holidayDescription: 'Feriado B3 · Não há negociação nos mercados da B3.',
    };
  }

  if (month === cinzasWed.month && day === cinzasWed.day) {
    return {
      isTradingDay: true,
      isWeekend: false,
      isHoliday: false,
      isPartialDay: true,
      holidayName: 'Quarta-feira de Cinzas',
      holidayDescription: 'Horário Especial B3 · Pregão inicia a partir das 13:00h.',
    };
  }

  if (month === goodFriday.month && day === goodFriday.day) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Sexta-feira Santa (Paixão de Cristo)',
      holidayDescription: 'Feriado Religioso Nacional · Não há negociação na B3.',
    };
  }

  if (month === corpusChristi.month && day === corpusChristi.day) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Corpus Christi',
      holidayDescription: 'Feriado Nacional B3 · Não há negociação de ativos.',
    };
  }

  // 2. Fixed national holidays in Brazil celebrated by B3
  if (month === 1 && day === 1) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Confraternização Universal (Ano Novo)',
      holidayDescription: 'Feriado Nacional · Mercado B3 fechado.',
    };
  }

  if (month === 4 && day === 21) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Tiradentes',
      holidayDescription: 'Feriado Nacional · Não há negociação na B3.',
    };
  }

  if (month === 5 && day === 1) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Dia Mundial do Trabalho',
      holidayDescription: 'Feriado Nacional · Mercado financeiro fechado.',
    };
  }

  if (month === 9 && day === 7) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Independência do Brasil',
      holidayDescription: 'Feriado Nacional · Não há pregão na B3.',
    };
  }

  if (month === 10 && day === 12) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Nossa Senhora Aparecida',
      holidayDescription: 'Feriado Nacional · Mercado B3 fechado.',
    };
  }

  if (month === 11 && day === 2) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Finados',
      holidayDescription: 'Feriado Nacional · Não há negociação na B3.',
    };
  }

  if (month === 11 && day === 15) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Proclamação da República',
      holidayDescription: 'Feriado Nacional · Não há negociação na B3.',
    };
  }

  if (month === 11 && day === 20) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Dia Nacional de Zumbi e da Consciência Negra',
      holidayDescription: 'Feriado Nacional Oficial · Não há pregão na B3.',
    };
  }

  if (month === 12 && day === 24) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Véspera de Natal',
      holidayDescription: 'Sem negociação nos mercados da B3.',
    };
  }

  if (month === 12 && day === 25) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Natal',
      holidayDescription: 'Feriado Mundial / Nacional · Não há negociação na B3.',
    };
  }

  if (month === 12 && day === 31) {
    return {
      isTradingDay: false,
      isWeekend,
      isHoliday: true,
      holidayName: 'Último Dia do Ano (Fechamento B3)',
      holidayDescription: 'Sem negociação de derivativos e ações na B3.',
    };
  }

  // If month is December, and day is 30 on a Friday (last business day before weekend 31st):
  if (month === 12 && day === 30 && weekday === 5) {
    return {
      isTradingDay: false,
      isWeekend: false,
      isHoliday: true,
      holidayName: 'Último Dia Útil do Ano (Fechamento B3)',
      holidayDescription: 'Sem expediente para negociação na B3.',
    };
  }

  // 3. Weekends
  if (isWeekend) {
    return {
      isTradingDay: false,
      isWeekend: true,
      isHoliday: false,
      holidayName: weekday === 0 ? 'Domingo' : 'Sábado',
      holidayDescription: 'Fim de semana · Não há pregão nos mercados da B3.',
    };
  }

  // Regular trading day
  return {
    isTradingDay: true,
    isWeekend: false,
    isHoliday: false,
  };
}

/**
 * Returns the last business day of a given month (1-12) and year,
 * taking into account weekends and B3 non-trading holidays.
 * (Critical for determining DARF due dates according to Receita Federal rules).
 */
export function getLastBusinessDayOfMonth(year: number, month: number): {
  year: number;
  month: number;
  day: number;
  dateStr: string;
  formattedBR: string;
} {
  const lastCalendarDay = new Date(year, month, 0).getDate();

  for (let day = lastCalendarDay; day >= 1; day--) {
    const status = getB3DayStatus(year, month, day);
    if (!status.isWeekend && !status.isHoliday && status.isTradingDay) {
      const mStr = String(month).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      return {
        year,
        month,
        day,
        dateStr: `${year}-${mStr}-${dStr}`,
        formattedBR: `${dStr}/${mStr}/${year}`,
      };
    }
  }

  // Fallback to last day
  const mStr = String(month).padStart(2, '0');
  const dStr = String(lastCalendarDay).padStart(2, '0');
  return {
    year,
    month,
    day: lastCalendarDay,
    dateStr: `${year}-${mStr}-${dStr}`,
    formattedBR: `${dStr}/${mStr}/${year}`,
  };
}

/**
 * Returns the official DARF due date for a specific trading month.
 * According to Receita Federal: "O imposto deve ser pago até o último dia útil do mês subsequente ao da apuração."
 */
export function getDarfDueDateForMonth(tradeYear: number, tradeMonth: number): {
  dueDate: string; // YYYY-MM-DD
  dueDateFormatted: string; // DD/MM/AAAA
  dueYear: number;
  dueMonth: number;
  dueDay: number;
} {
  let nextYear = tradeYear;
  let nextMonth = tradeMonth + 1;
  if (nextMonth > 12) {
    nextYear += 1;
    nextMonth = 1;
  }

  const lastBiz = getLastBusinessDayOfMonth(nextYear, nextMonth);
  return {
    dueDate: lastBiz.dateStr,
    dueDateFormatted: lastBiz.formattedBR,
    dueYear: lastBiz.year,
    dueMonth: lastBiz.month,
    dueDay: lastBiz.day,
  };
}

