// data.js — Dados iniciais para seed do Firebase
// Itens e histórico completo de 2026 conforme planilha de controle
// UNIDADES: exceto Bobinas (PCT) e Label (PCT), todos os demais em unidades individuais

const initialItems = [
    { id: 'bobinas',       name: 'Bobinas (PCT) 84 un.',   min: 2    },
    { id: 'caixas',        name: 'Caixas',                  min: 100  },
    { id: 'embalagem',     name: 'Embalagem',               min: 200  },
    { id: 'chips',         name: 'Chips',                   min: 100  },
    { id: 'embalagem_awb', name: 'Embalagem AWB',           min: 400  },
    { id: 'sacola',        name: 'Sacola de evento',        min: 0    },
    { id: 'folha_a4',      name: 'Folha A4',                min: 1000 },
    { id: 'bobina_termica',name: 'Bobina térmica (RL)',     min: 2    },
    { id: 'label',         name: 'Label (PCT) 50 un.',      min: 3    },
    { id: 'carregadores',  name: 'Carregadores de base',    min: 30   },
    { id: 'luvas',         name: 'Luvas',                   min: 200  }
];

// Histórico semanal de 2026
// Conversão aplicada: caixas×50, embalagem×100, chips×50, embalagem_awb×200, luvas×100
// folha_a4×500 (sem dados históricos), sacola e outros já em unidades individuais
const initialWeeksData = [
    {
        week: 'Semana 2', date: 'sexta-feira 2 de janeiro',
        values: { bobinas: 9, caixas: 200, embalagem: 400, chips: 750, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 4, label: 6, carregadores: 48, luvas: 500 }
    },
    {
        week: 'Semana 3', date: 'sexta-feira 9 de janeiro',
        values: { bobinas: 9, caixas: 200, embalagem: 400, chips: 750, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 4, label: 6, carregadores: 46, luvas: 500 }
    },
    {
        week: 'Semana 4', date: 'sexta-feira 16 de janeiro',
        values: { bobinas: 8, caixas: 150, embalagem: 400, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 4, label: 6, carregadores: 43, luvas: 500 }
    },
    {
        week: 'Semana 5', date: 'sexta-feira 23 de janeiro',
        values: { bobinas: 5, caixas: 200, embalagem: 300, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 3, label: 6, carregadores: 39, luvas: 500 }
    },
    {
        week: 'Semana 6', date: 'sexta-feira 30 de janeiro',
        values: { bobinas: 5, caixas: 200, embalagem: 300, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 3, label: 6, carregadores: 39, luvas: 500 }
    },
    {
        week: 'Semana 7', date: 'sexta-feira 6 de fevereiro',
        values: { bobinas: 5, caixas: 200, embalagem: 300, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 3, label: 6, carregadores: 36, luvas: 500 }
    },
    {
        week: 'Semana 8', date: 'sexta-feira 13 de fevereiro',
        values: { bobinas: 5, caixas: 200, embalagem: 300, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 3, label: 6, carregadores: 35, luvas: 500 }
    },
    {
        week: 'Semana 9', date: 'sexta-feira 20 de fevereiro',
        values: { bobinas: 5, caixas: 150, embalagem: 300, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 3, label: 6, carregadores: 35, luvas: 500 }
    },
    {
        week: 'Semana 10', date: 'sexta-feira 27 de fevereiro',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 11', date: 'sexta-feira 6 de março',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 12', date: 'sexta-feira 13 de março',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 13', date: 'sexta-feira 20 de março',
        values: { bobinas: 3, caixas: 50, embalagem: 600, chips: 400, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 9, label: 6, carregadores: 50, luvas: 500 }
    },
    {
        week: 'Semana 14', date: 'sexta-feira 27 de março',
        values: { bobinas: 2, caixas: 50, embalagem: 500, chips: 400, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 9, label: 3, carregadores: 25, luvas: 500 }
    },
    {
        week: 'Semana 15', date: 'sexta-feira 3 de abril',
        values: { bobinas: 2, caixas: 50, embalagem: 400, chips: 400, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 8, label: 3, carregadores: 6, luvas: 500 }
    },
    {
        week: 'Semana 16', date: 'sexta-feira 10 de abril',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 17', date: 'sexta-feira 17 de abril',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 18', date: 'sexta-feira 24 de abril',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 19', date: 'sexta-feira 1 de maio',
        values: { bobinas: 13, caixas: 2000, embalagem: 200, chips: 400, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 8, label: 3, carregadores: 70, luvas: 500 }
    },
    {
        week: 'Semana 20', date: 'sexta-feira 8 de maio',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 21', date: 'sexta-feira 15 de maio',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 22', date: 'sexta-feira 22 de maio',
        values: { bobinas: 8, caixas: 0, embalagem: 1600, chips: 50, embalagem_awb: '-', sacola: 0, folha_a4: '-', bobina_termica: 7, label: 9, carregadores: 0, luvas: 0 }
    },
    {
        week: 'Semana 23', date: 'sexta-feira 29 de maio',
        values: { bobinas: 8, caixas: 0, embalagem: 1400, chips: 200, embalagem_awb: '-', sacola: 0, folha_a4: '-', bobina_termica: 7, label: 9, carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 24', date: 'sexta-feira 5 de junho',
        values: { bobinas: 7, caixas: '-', embalagem: 1700, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 7, label: 7, carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 25', date: 'sexta-feira 12 de junho',
        values: { bobinas: 5, caixas: 50, embalagem: 1600, chips: 500, embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: 6, label: 6, carregadores: '-', luvas: '-' }
    },
    {
        week: 'Semana 26', date: 'sexta-feira 19 de junho',
        values: { bobinas: '-', caixas: '-', embalagem: '-', chips: '-', embalagem_awb: '-', sacola: '-', folha_a4: '-', bobina_termica: '-', label: '-', carregadores: '-', luvas: '-' }
    }
];

const initialCosts = [
  { id: 'bobinas',        name: 'Bobinas (PCT) 84 un.',   unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'caixas',         name: 'Caixas',                  unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'embalagem',      name: 'Embalagem',               unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'chips',          name: 'Chips',                   unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'embalagem_awb',  name: 'Embalagem AWB',           unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'sacola',         name: 'Sacola de evento',        unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'folha_a4',       name: 'Folha A4',                unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'bobina_termica', name: 'Bobina térmica (RL)',     unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'label',          name: 'Label (PCT) 50 un.',      unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'carregadores',   name: 'Carregadores de base',    unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'luvas',          name: 'Luvas',                   unitValue: 0,      lastPurchaseDate: '', isCustom: false },
  { id: 'maquina_q92x',   name: 'Máquina Clinipay Q92X',  unitValue: 464.35, lastPurchaseDate: '', isCustom: true,  quantity: 1 }
];
