export type Language = "pt" | "es" | "en";

export interface Translations {
  // Comum / Global
  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    close: string;
    confirm: string;
    delete: string;
    edit: string;
    filter: string;
    all: string;
    search: string;
    today: string;
    open: string;
    closed: string;
    status: string;
    actions: string;
    copied: string;
    copy: string;
    people: string;
    guest: string;
    guests: string;
    notes: string;
    phone: string;
    email: string;
    name: string;
    table: string;
    date: string;
    time: string;
    shift: string;
    lunch: string;
    dinner: string;
    general: string;
    sector: string;
    anySector: string;
    mainRoom: string;
    terrace: string;
    counter: string;
    understood: string;
    demoMode: string;
    endSession: string;
    poweredBy: string;
  };
  days: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
  };
  // Navegação
  nav: {
    cockpit: string;
    analytics: string;
    reservations: string;
    tables: string;
    waiterMode: string;
    pos: string;
    kitchen: string;
    inventory: string;
    finance: string;
    moreFunctions: string;
  };
  // Módulo de Reservas
  reservations: {
    title: string;
    subtitle: string;
    linkGoogleBtn: string;
    companyScheduleBtn: string;
    newReservationBtn: string;
    metricsDayTotal: string;
    metricsGuestsTotal: string;
    metricsSeatedTotal: string;
    metricsPendingTotal: string;
    restaurantOpenToday: string;
    restaurantClosedToday: string;
    noReservationsFound: string;
    noReservationsDesc: string;
    createNow: string;
    statusConfirmed: string;
    statusPending: string;
    statusSeated: string;
    statusCanceled: string;
    clientArrivedBtn: string;
    confirmBtn: string;
    cancelBtn: string;
    tableOpenedInRoom: string;
    origin: string;
    scheduleModalTitle: string;
    scheduleModalDesc: string;
    slotInterval: string;
    maxGuestsSlot: string;
    closedDayWarning: string;
    saveSchedule: string;
    scheduleSavedSuccess: string;
    newModalTitle: string;
    newModalDesc: string;
    closedDayAlert: string;
    closedDayAlertDesc: string;
    availableTimes: string;
    noTimesConfigured: string;
    preferredArea: string;
    linkModalTitle: string;
    linkModalDesc: string;
    directLinkLabel: string;
    howGoogleWorksTitle: string;
    howGoogleWorksDesc: string;
    googleStep1: string;
    googleStep2: string;
    googleStep3: string;
    googleTip: string;
    checkInTitle: string;
    checkInDesc: string;
    checkInSelectTable: string;
    checkInConfirmBtn: string;
    allTablesOccupied: string;
  };
  // Formulário Público de Reservas
  publicBooking: {
    pageTitle: string;
    pageSubtitle: string;
    bookYourTableTitle: string;
    bookYourTableSubtitle: string;
    selectDateLabel: string;
    selectTimeLabel: string;
    selectGuestsLabel: string;
    environmentLabel: string;
    contactInfoLabel: string;
    fullNamePlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    notesPlaceholder: string;
    submitBtn: string;
    submittingBtn: string;
    confirmedTitle: string;
    confirmedSubtitle: string;
    holderLabel: string;
    dateLabel: string;
    timeLabel: string;
    guestsLabel: string;
    arrivalNotice: string;
    bookAnotherBtn: string;
    closedAlertTitle: string;
    closedAlertDesc: string;
  };
  // Mesas e Salão
  tables: {
    title: string;
    subtitle: string;
    qrPlates: string;
    addBatchTables: string;
    creating: string;
    newTable: string;
    registeredTables: string;
    occupiedTables: string;
    freeTables: string;
    openConsumption: string;
    allSectors: string;
    occupied: string;
    free: string;
    calling: string;
    estDeparture: string;
    items: string;
    sendToKitchen: string;
    openTable: string;
    reservationsToday: string;
  };
  // Analytics & BI
  analytics: {
    title: string;
    subtitle: string;
    badge: string;
    realtimeSync: string;
    exportCsv: string;
    biTab: string;
    escandalloTab: string;
    filters: string;
    today: string;
    yesterday: string;
    last7days: string;
    thisMonth: string;
    allShifts: string;
    lunchShift: string;
    dinnerShift: string;
    allWaiters: string;
    hourlyTitle: string;
    hourlySubtitle: string;
    bcgTitle: string;
    bcgSubtitle: string;
    stars: string;
    horses: string;
    puzzles: string;
    dogs: string;
    fefoTitle: string;
    fefoSubtitle: string;
    fefoBadge: string;
    miseEnPlaceTitle: string;
    miseEnPlaceSubtitle: string;
    waiterRankingTitle: string;
    waiterRankingSubtitle: string;
  };
  // Engenharia de Custos & Escandallo
  escandallo: {
    title: string;
    subtitle: string;
    recipeSelection: string;
    category: string;
    currentSalePrice: string;
    targetMargin: string;
    overheadPercent: string;
    vatRate: string;
    ingredientsTitle: string;
    ingredientsDesc: string;
    addCustomIngredient: string;
    addFromStock: string;
    saveTechnicalSheet: string;
    saving: string;
    sheetSavedSuccess: string;
    colIngredient: string;
    colWholesalePrice: string;
    colWholesalePack: string;
    colPortion: string;
    colPortionCost: string;
    colOrigin: string;
    colActions: string;
    stockLinked: string;
    custom: string;
    removeIngredient: string;
    stockModalTitle: string;
    stockModalDesc: string;
    stockSearchPlaceholder: string;
    noStockFound: string;
    stockBatch: string;
    stockAvailable: string;
    stockCost: string;
    selectStockBtn: string;
    kpiDirectCost: string;
    kpiGrossMargin: string;
    kpiNetProfit: string;
    kpiBreakeven: string;
    suggestedPrice: string;
    lossAlert: string;
  };
}

export const translations: Record<Language, Translations> = {
  pt: {
    common: {
      loading: "A carregar...",
      save: "Guardar",
      saving: "A guardar...",
      cancel: "Cancelar",
      close: "Fechar",
      confirm: "Confirmar",
      delete: "Excluir",
      edit: "Editar",
      filter: "Filtrar",
      all: "Todas",
      search: "Pesquisar...",
      today: "Hoje",
      open: "Aberto",
      closed: "Fechado",
      status: "Estado",
      actions: "Ações",
      copied: "Copiado!",
      copy: "Copiar",
      people: "pessoas",
      guest: "pessoa",
      guests: "pessoas",
      notes: "Observações",
      phone: "Telefone / WhatsApp",
      email: "E-mail",
      name: "Nome",
      table: "Mesa",
      date: "Data",
      time: "Horário",
      shift: "Turno",
      lunch: "Almoço",
      dinner: "Jantar",
      general: "Geral",
      sector: "Setor",
      anySector: "Qualquer Setor",
      mainRoom: "Salão Principal",
      terrace: "Esplanada (Exterior)",
      counter: "Balcão",
      understood: "Entendido",
      demoMode: "Modo Demonstração",
      endSession: "Encerrar Sessão",
      poweredBy: "Desenvolvido por"
    },
    days: {
      0: "Domingo",
      1: "Segunda-feira",
      2: "Terça-feira",
      3: "Quarta-feira",
      4: "Quinta-feira",
      5: "Sexta-feira",
      6: "Sábado"
    },
    nav: {
      cockpit: "Cockpit",
      analytics: "Inteligência & BI",
      reservations: "Reservas",
      tables: "Mesas & Salão",
      waiterMode: "Modo Garçom",
      pos: "PDV (Caixa)",
      kitchen: "Cozinha (KDS)",
      inventory: "Estoque",
      finance: "Financeiro & DRE",
      moreFunctions: "Mais Funções"
    },
    reservations: {
      title: "Gestão de Reservas",
      subtitle: "Agendamentos, turnos de funcionamento e integração com as mesas do salão.",
      linkGoogleBtn: "Link Google & Clientes",
      companyScheduleBtn: "Horários da Empresa",
      newReservationBtn: "+ Nova Reserva",
      metricsDayTotal: "Reservas do Dia",
      metricsGuestsTotal: "Total de Convidados",
      metricsSeatedTotal: "Check-in Realizado",
      metricsPendingTotal: "Aguardando Confirmação",
      restaurantOpenToday: "Restaurante Aberto neste dia",
      restaurantClosedToday: "Empresa Fechada neste dia (Configuração semanal)",
      noReservationsFound: "Nenhuma reserva encontrada",
      noReservationsDesc: "Não há agendamentos para esta data com os filtros selecionados.",
      createNow: "Criar Reserva Agora",
      statusConfirmed: "Confirmada",
      statusPending: "Pendente",
      statusSeated: "Sentada",
      statusCanceled: "Cancelada",
      clientArrivedBtn: "Cliente Chegou",
      confirmBtn: "Confirmar",
      cancelBtn: "Cancelar",
      tableOpenedInRoom: "Mesa Aberta no Salão",
      origin: "Canal",
      scheduleModalTitle: "Dias & Horários de Funcionamento",
      scheduleModalDesc: "Defina os dias em que a casa abre e os turnos aceitos para reserva.",
      slotInterval: "Intervalo dos Horários",
      maxGuestsSlot: "Capacidade Máxima / Slot",
      closedDayWarning: "Dias fechados não poderão ser reservados nem no painel nem pelo cliente.",
      saveSchedule: "Guardar Horários",
      scheduleSavedSuccess: "Horários atualizados com sucesso!",
      newModalTitle: "Nova Reserva de Mesa",
      newModalDesc: "Agende atendimento para clientes respeitando os dias abertos da casa.",
      closedDayAlert: "O restaurante não funciona neste dia!",
      closedDayAlertDesc: "Por favor, escolha outro dia para agendar a reserva.",
      availableTimes: "Horário Disponível",
      noTimesConfigured: "Nenhum turno configurado para este dia nas configurações de funcionamento.",
      preferredArea: "Setor Preferido",
      linkModalTitle: "Link Público & Google Maps",
      linkModalDesc: "Permita que os clientes façam reservas online pelo Google ou WhatsApp",
      directLinkLabel: "Link Direto para Clientes / Redes Sociais:",
      howGoogleWorksTitle: "Como funciona com o Reservar com o Google?",
      howGoogleWorksDesc: "No seu Perfil da Empresa no Google (Google Meu Negócio / Maps), você tem a opção nativa de adicionar um Link de Reserva.",
      googleStep1: "Acesse o seu Perfil no Google Meu Negócio / Maps.",
      googleStep2: "Clique em Reservas > Adicionar link de agendamento.",
      googleStep3: "Cole o link copiado acima.",
      googleTip: "Pronto! Quando o cliente pesquisar seu restaurante no Google e clicar em Reservar, o formulário abrirá com os dias em que sua empresa realmente funciona!",
      checkInTitle: "Check-in de Reserva",
      checkInDesc: "Ocupar mesa e abrir comanda no salão",
      checkInSelectTable: "Selecione a Mesa para Acomodar:",
      checkInConfirmBtn: "Confirmar Chegada & Sentar",
      allTablesOccupied: "Todas as mesas estão ocupadas no momento!"
    },
    publicBooking: {
      pageTitle: "Reserva de Mesa Online",
      pageSubtitle: "Garanta seu lugar com praticidade",
      bookYourTableTitle: "Garanta sua Mesa",
      bookYourTableSubtitle: "Escolha o dia, horário e quantidade de pessoas.",
      selectDateLabel: "Selecione a Data *",
      selectTimeLabel: "Horário Desejado *",
      selectGuestsLabel: "Pessoas *",
      environmentLabel: "Ambiente",
      contactInfoLabel: "Seus Dados de Contato",
      fullNamePlaceholder: "Seu nome completo *",
      phonePlaceholder: "WhatsApp / Telefone *",
      emailPlaceholder: "E-mail (opcional)",
      notesPlaceholder: "Observação (ex: Aniversário, bebê, alergias)",
      submitBtn: "Confirmar Minha Reserva 🍽️",
      submittingBtn: "A confirmar reserva...",
      confirmedTitle: "Reserva Confirmada!",
      confirmedSubtitle: "Aguardamos por você no",
      holderLabel: "Titular:",
      dateLabel: "Data:",
      timeLabel: "Horário:",
      guestsLabel: "Convidados:",
      arrivalNotice: "Por favor, chegue com até 15 minutos de antecedência. Em caso de imprevisto, contate o restaurante.",
      bookAnotherBtn: "Fazer Outra Reserva",
      closedAlertTitle: "O restaurante não abre neste dia!",
      closedAlertDesc: "Por favor, selecione outro dia da semana para agendar sua mesa."
    },
    tables: {
      title: "Gestão de Mesas & Salão",
      subtitle: "Atendimento, setores (Salão, Esplanada, Balcão) e escala de capacidade.",
      qrPlates: "Plaquinhas QR",
      addBatchTables: "+ 6 Mesas (Lote)",
      creating: "A criar...",
      newTable: "+ Nova Mesa",
      registeredTables: "Mesas Cadastradas",
      occupiedTables: "Mesas Ocupadas",
      freeTables: "Mesas Livres",
      openConsumption: "Consumo Aberto",
      allSectors: "TODOS SETORES",
      occupied: "Ocupada",
      free: "Livre",
      calling: "Chamando!",
      estDeparture: "Saída est.:",
      items: "itens",
      sendToKitchen: "para a cozinha",
      openTable: "Abrir Mesa",
      reservationsToday: "Reservas"
    },
    analytics: {
      title: "Inteligência de Operação & Cardápio",
      subtitle: "Curva de procura, engenharia de cardápio, previsão de mise en place e radar anti-desperdício.",
      badge: "Enterprise BI & Analytics",
      realtimeSync: "Sincronização em Tempo Real",
      exportCsv: "Exportar Relatório (CSV)",
      biTab: "1. BI & Inteligência de Operação",
      escandalloTab: "2. Engenharia de Custos & Escandallo (Margens & Lucro)",
      filters: "Filtros:",
      today: "Hoje",
      yesterday: "Ontem",
      last7days: "Últimos 7 dias",
      thisMonth: "Este Mês",
      allShifts: "Todos os Turnos",
      lunchShift: "Turno Almoço (11h-16h)",
      dinnerShift: "Turno Jantar (18h-23h)",
      allWaiters: "Todos os Garçons",
      hourlyTitle: "Curva de Procura por Horário (Vendas €)",
      hourlySubtitle: "Identifique vales de movimento para promoções dinâmicas e picos para dimensionar brigada.",
      bcgTitle: "Engenharia de Cardápio (Matriz BCG Dinâmica)",
      bcgSubtitle: "Volume de Vendas vs. Margem de Contribuição por Prato.",
      stars: "Estrelas (Alta Venda + Alta Margem)",
      horses: "Cavalos de Batalha (Alta Venda + Baixa Margem)",
      puzzles: "Quebra-cabeças (Baixa Venda + Alta Margem)",
      dogs: "Cães / Perdedores (Baixa Venda + Baixa Margem)",
      fefoTitle: "Radar Anti-Desperdício (FEFO / Lotes Críticos)",
      fefoSubtitle: "Ingredientes que vencem em até 3 dias. Sugestões automatizadas de promoção para escoamento rápido.",
      fefoBadge: "Urgência de Consumo",
      miseEnPlaceTitle: "Previsão Inteligente de Mise en Place",
      miseEnPlaceSubtitle: "Estimativa de preparação da cozinha com base no histórico do dia e do turno.",
      waiterRankingTitle: "Performance & Produtividade da Equipa",
      waiterRankingSubtitle: "Ranking de faturamento, ticket médio e mesas atendidas."
    },
    escandallo: {
      title: "Engenharia de Custos & Escandallo Dinâmico",
      subtitle: "Cálculo de porção exata por matéria-prima, ponto de equilíbrio (zero prejuízo) e simulação de margens de lucro.",
      recipeSelection: "Prato / Receita Analisada:",
      category: "Categoria:",
      currentSalePrice: "Preço de Venda Praticado (c/ IVA):",
      targetMargin: "Margem Bruta Alvo (%):",
      overheadPercent: "Rateio Operacional (Luz/Gás/Equipe %):",
      vatRate: "Alíquota IVA (%):",
      ingredientsTitle: "Ficha Técnica dos Insumos (Escandallo)",
      ingredientsDesc: "Ajuste preços de compra de atacado e quantidades da porção em tempo real.",
      addCustomIngredient: "+ Insumo Manual",
      addFromStock: "+ Insumo do Estoque",
      saveTechnicalSheet: "Salvar Ficha Técnica no Sistema",
      saving: "A guardar...",
      sheetSavedSuccess: "Ficha Técnica guardada e vinculada ao Estoque com sucesso!",
      colIngredient: "Insumo",
      colWholesalePrice: "Preço Compra Atacado",
      colWholesalePack: "Embalagem Atacado",
      colPortion: "Porção no Prato",
      colPortionCost: "Custo da Porção",
      colOrigin: "Origem",
      colActions: "Ações",
      stockLinked: "Estoque Conectado",
      custom: "Manual",
      removeIngredient: "Remover insumo",
      stockModalTitle: "Selecionar Insumo do Estoque Real",
      stockModalDesc: "Escolha um produto cadastrado no seu estoque para preencher o preço de compra e vincular a baixa automática.",
      stockSearchPlaceholder: "Pesquisar insumo do estoque...",
      noStockFound: "Nenhum insumo encontrado no estoque.",
      stockBatch: "Lote:",
      stockAvailable: "Disponível:",
      stockCost: "Custo:",
      selectStockBtn: "Adicionar à Ficha",
      kpiDirectCost: "CMV Direto (Insumos)",
      kpiGrossMargin: "Margem Bruta Praticada",
      kpiNetProfit: "Lucro Líquido Unitário",
      kpiBreakeven: "Ponto de Equilíbrio (Break-Even)",
      suggestedPrice: "Preço Sugerido para Margem Alvo",
      lossAlert: "ATENÇÃO: Este prato está a dar PREJUÍZO! O preço atual não cobre insumos e custos fixos."
    }
  },

  es: {
    common: {
      loading: "Cargando...",
      save: "Guardar",
      saving: "Guardando...",
      cancel: "Cancelar",
      close: "Cerrar",
      confirm: "Confirmar",
      delete: "Eliminar",
      edit: "Editar",
      filter: "Filtrar",
      all: "Todas",
      search: "Buscar...",
      today: "Hoy",
      open: "Abierto",
      closed: "Cerrado",
      status: "Estado",
      actions: "Acciones",
      copied: "¡Copiado!",
      copy: "Copiar",
      people: "personas",
      guest: "persona",
      guests: "personas",
      notes: "Observaciones",
      phone: "Teléfono / WhatsApp",
      email: "Correo electrónico",
      name: "Nombre",
      table: "Mesa",
      date: "Fecha",
      time: "Hora",
      shift: "Turno",
      lunch: "Almuerzo",
      dinner: "Cena",
      general: "General",
      sector: "Sector",
      anySector: "Cualquier Sector",
      mainRoom: "Salón Principal",
      terrace: "Terraza (Exterior)",
      counter: "Barra / Balcón",
      understood: "Entendido",
      demoMode: "Modo Demostración",
      endSession: "Cerrar Sesión",
      poweredBy: "Desarrollado por"
    },
    days: {
      0: "Domingo",
      1: "Lunes",
      2: "Martes",
      3: "Miércoles",
      4: "Jueves",
      5: "Viernes",
      6: "Sábado"
    },
    nav: {
      cockpit: "Panel de Control",
      analytics: "Inteligencia & BI",
      reservations: "Reservas",
      tables: "Mesas & Salón",
      waiterMode: "Modo Camarero",
      pos: "TPV (Caja)",
      kitchen: "Cocina (KDS)",
      inventory: "Inventario",
      finance: "Finanzas & DRE",
      moreFunctions: "Más Funciones"
    },
    reservations: {
      title: "Gestión de Reservas",
      subtitle: "Reservas, turnos de operación y asignación a mesas del salón.",
      linkGoogleBtn: "Enlace Google & Clientes",
      companyScheduleBtn: "Horarios del Negocio",
      newReservationBtn: "+ Nueva Reserva",
      metricsDayTotal: "Reservas de Hoy",
      metricsGuestsTotal: "Total de Comensales",
      metricsSeatedTotal: "Check-in Realizado",
      metricsPendingTotal: "Pendientes de Confirmar",
      restaurantOpenToday: "Restaurante Abierto hoy",
      restaurantClosedToday: "Negocio Cerrado hoy (Configuración semanal)",
      noReservationsFound: "No se encontraron reservas",
      noReservationsDesc: "No hay reservas para esta fecha con los filtros actuales.",
      createNow: "Crear Reserva Ahora",
      statusConfirmed: "Confirmada",
      statusPending: "Pendiente",
      statusSeated: "Sentada",
      statusCanceled: "Cancelada",
      clientArrivedBtn: "Cliente Llegó",
      confirmBtn: "Confirmar",
      cancelBtn: "Cancelar",
      tableOpenedInRoom: "Mesa Ocupada en Salón",
      origin: "Canal",
      scheduleModalTitle: "Días & Horarios de Apertura",
      scheduleModalDesc: "Configure los días abiertos y los turnos para admitir reservas.",
      slotInterval: "Intervalo de Horarios",
      maxGuestsSlot: "Capacidad Máxima / Turno",
      closedDayWarning: "Los días cerrados no podrán ser reservados por clientes ni personal.",
      saveSchedule: "Guardar Horarios",
      scheduleSavedSuccess: "¡Horarios actualizados con éxito!",
      newModalTitle: "Nueva Reserva de Mesa",
      newModalDesc: "Registre comensales respetando los días hábiles del restaurante.",
      closedDayAlert: "¡El restaurante está cerrado este día!",
      closedDayAlertDesc: "Por favor, elija otro día de la semana para programar la reserva.",
      availableTimes: "Horarios Disponibles",
      noTimesConfigured: "No hay turnos configurados para este día.",
      preferredArea: "Área de Preferencia",
      linkModalTitle: "Enlace Público & Google Maps",
      linkModalDesc: "Permita que los clientes reserven en línea desde Google Maps o WhatsApp",
      directLinkLabel: "Enlace Directo para Clientes / Redes:",
      howGoogleWorksTitle: "¿Cómo funciona con Reservar con Google?",
      howGoogleWorksDesc: "En el Perfil de Empresa en Google (Google Maps), puede añadir un Enlace de Reserva oficial.",
      googleStep1: "Acceda a su Perfil de Empresa en Google Maps.",
      googleStep2: "Haga clic en Reservas > Añadir enlace de reserva.",
      googleStep3: "Pegue el enlace copiado arriba.",
      googleTip: "¡Listo! Cuando los clientes busquen su restaurante en Google y hagan clic en Reservar, solo podrán reservar los días que usted abre.",
      checkInTitle: "Check-in de Reserva",
      checkInDesc: "Asignar mesa y abrir cuenta en el salón",
      checkInSelectTable: "Seleccione la Mesa Disponible:",
      checkInConfirmBtn: "Confirmar Llegada & Sentar",
      allTablesOccupied: "¡Todas las mesas están ocupadas en este momento!"
    },
    publicBooking: {
      pageTitle: "Reserva de Mesa en Línea",
      pageSubtitle: "Asegure su mesa de forma rápida y sencilla",
      bookYourTableTitle: "Asegure su Mesa",
      bookYourTableSubtitle: "Seleccione fecha, hora y cantidad de comensales.",
      selectDateLabel: "Seleccione la Fecha *",
      selectTimeLabel: "Hora Deseada *",
      selectGuestsLabel: "Personas *",
      environmentLabel: "Ambiente",
      contactInfoLabel: "Datos de Contacto",
      fullNamePlaceholder: "Su nombre completo *",
      phonePlaceholder: "WhatsApp / Teléfono *",
      emailPlaceholder: "Correo electrónico (opcional)",
      notesPlaceholder: "Observaciones (ej. Cumpleaños, trona de bebé, alergias)",
      submitBtn: "Confirmar Mi Reserva 🍽️",
      submittingBtn: "Confirmando reserva...",
      confirmedTitle: "¡Reserva Confirmada!",
      confirmedSubtitle: "Le esperamos en",
      holderLabel: "Titular:",
      dateLabel: "Fecha:",
      timeLabel: "Hora:",
      guestsLabel: "Comensales:",
      arrivalNotice: "Por favor, llegue con 10-15 minutos de anticipación. Para cambios, contacte al local.",
      bookAnotherBtn: "Hacer Otra Reserva",
      closedAlertTitle: "¡El restaurante no abre este día!",
      closedAlertDesc: "Por favor, elija un día en que el restaurante esté abierto."
    },
    tables: {
      title: "Gestión de Mesas & Salón",
      subtitle: "Atención, sectores (Salón, Terraza, Barra) y escala de capacidad.",
      qrPlates: "Códigos QR",
      addBatchTables: "+ 6 Mesas (Lote)",
      creating: "Creando...",
      newTable: "+ Nueva Mesa",
      registeredTables: "Mesas Totales",
      occupiedTables: "Mesas Ocupadas",
      freeTables: "Mesas Libres",
      openConsumption: "Consumo Abierto",
      allSectors: "TODOS LOS SECTORES",
      occupied: "Ocupada",
      free: "Libre",
      calling: "¡Llamando!",
      estDeparture: "Salida est.:",
      items: "artículos",
      sendToKitchen: "a la cocina",
      openTable: "Abrir Mesa",
      reservationsToday: "Reservas"
    },
    analytics: {
      title: "Inteligencia de Operación & Menú",
      subtitle: "Curva de demanda, ingeniería de menú, previsión de mise en place y radar antidesperdicio.",
      badge: "Enterprise BI & Analytics",
      realtimeSync: "Sincronización en Tiempo Real",
      exportCsv: "Exportar Informe (CSV)",
      biTab: "1. BI & Inteligencia Operativa",
      escandalloTab: "2. Ingeniería de Costes & Escandallo (Márgenes & Beneficio)",
      filters: "Filtros:",
      today: "Hoy",
      yesterday: "Ayer",
      last7days: "Últimos 7 días",
      thisMonth: "Este Mes",
      allShifts: "Todos los Turnos",
      lunchShift: "Turno Comida (11h-16h)",
      dinnerShift: "Turno Cena (18h-23h)",
      allWaiters: "Todos los Camareros",
      hourlyTitle: "Curva de Demanda por Horario (Ventas €)",
      hourlySubtitle: "Identifique valles para promociones dinámicas y picos para dimensionar el equipo.",
      bcgTitle: "Ingeniería de Menú (Matriz BCG Dinámica)",
      bcgSubtitle: "Volumen de Ventas vs. Margen de Contribución por Plato.",
      stars: "Estrellas (Alta Venta + Alto Margen)",
      horses: "Caballos de Batalla (Alta Venta + Bajo Margen)",
      puzzles: "Rompecabezas (Baja Venta + Alto Margen)",
      dogs: "Perros / Perdedores (Baja Venta + Bajo Margen)",
      fefoTitle: "Radar Antidesperdicio (FEFO / Lotes Críticos)",
      fefoSubtitle: "Ingredientes que caducan en menos de 3 días. Sugerencias automáticas de promoción activa.",
      fefoBadge: "Urgencia de Consumo",
      miseEnPlaceTitle: "Previsión Inteligente de Mise en Place",
      miseEnPlaceSubtitle: "Estimación de preparación en cocina según histórico del día y turno.",
      waiterRankingTitle: "Rendimiento & Productividad del Equipo",
      waiterRankingSubtitle: "Ranking de facturación, ticket medio y mesas atendidas."
    },
    escandallo: {
      title: "Ingeniería de Costes & Escandallo Dinámico",
      subtitle: "Cálculo de porción exacta por materia prima, punto de equilibrio (cero pérdidas) y simulación de márgenes.",
      recipeSelection: "Plato / Receta Analizada:",
      category: "Categoría:",
      currentSalePrice: "Precio de Venta Aplicado (c/ IVA):",
      targetMargin: "Margen Bruto Objetivo (%):",
      overheadPercent: "Costes Fijos Operativos (%):",
      vatRate: "Tipo de IVA (%):",
      ingredientsTitle: "Ficha Técnica de Ingredientes (Escandallo)",
      ingredientsDesc: "Ajuste precios de compra mayorista y cantidades de porción en tiempo real.",
      addCustomIngredient: "+ Ingrediente Manual",
      addFromStock: "+ Ingrediente del Almacén",
      saveTechnicalSheet: "Guardar Ficha Técnica en el Sistema",
      saving: "Guardando...",
      sheetSavedSuccess: "¡Ficha Técnica guardada y vinculada al Almacén con éxito!",
      colIngredient: "Ingrediente",
      colWholesalePrice: "Precio Compra Mayorista",
      colWholesalePack: "Envase Mayorista",
      colPortion: "Porción en el Plato",
      colPortionCost: "Coste de la Porção",
      colOrigin: "Origen",
      colActions: "Acciones",
      stockLinked: "Almacén Conectado",
      custom: "Manual",
      removeIngredient: "Eliminar ingrediente",
      stockModalTitle: "Seleccionar Ingrediente del Almacén Real",
      stockModalDesc: "Elija un producto registrado en su almacén para rellenar el precio de coste y vincular la baja automática.",
      stockSearchPlaceholder: "Buscar ingrediente en almacén...",
      noStockFound: "No se encontraron ingredientes en el almacén.",
      stockBatch: "Lote:",
      stockAvailable: "Disponible:",
      stockCost: "Coste:",
      selectStockBtn: "Añadir a la Ficha",
      kpiDirectCost: "Coste Directo (Materia Prima)",
      kpiGrossMargin: "Margen Bruto Actual",
      kpiNetProfit: "Beneficio Neto Unitario",
      kpiBreakeven: "Punto de Equilibrio (Break-Even)",
      suggestedPrice: "Precio Sugerido para Margen Objetivo",
      lossAlert: "¡ATENCIÓN! Este plato está generando PÉRDIDAS. El precio actual no cubre costes fijos e ingredientes."
    }
  },

  en: {
    common: {
      loading: "Loading...",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      close: "Close",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      filter: "Filter",
      all: "All",
      search: "Search...",
      today: "Today",
      open: "Open",
      closed: "Closed",
      status: "Status",
      actions: "Actions",
      copied: "Copied!",
      copy: "Copy",
      people: "people",
      guest: "guest",
      guests: "guests",
      notes: "Notes",
      phone: "Phone / WhatsApp",
      email: "Email",
      name: "Name",
      table: "Table",
      date: "Date",
      time: "Time",
      shift: "Shift",
      lunch: "Lunch",
      dinner: "Dinner",
      general: "General",
      sector: "Area",
      anySector: "Any Area",
      mainRoom: "Main Dining Room",
      terrace: "Outdoor Terrace",
      counter: "Bar / Counter",
      understood: "Understood",
      demoMode: "Demo Mode",
      endSession: "Sign Out",
      poweredBy: "Powered by"
    },
    days: {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday"
    },
    nav: {
      cockpit: "Dashboard",
      analytics: "Intelligence & BI",
      reservations: "Reservations",
      tables: "Tables & Floor",
      waiterMode: "Waiter Mode",
      pos: "POS (Cash)",
      kitchen: "Kitchen (KDS)",
      inventory: "Inventory",
      finance: "Financial & P&L",
      moreFunctions: "More Tools"
    },
    reservations: {
      title: "Reservation Management",
      subtitle: "Bookings, operating shifts, and direct table assignment.",
      linkGoogleBtn: "Google & Client Link",
      companyScheduleBtn: "Opening Hours",
      newReservationBtn: "+ New Booking",
      metricsDayTotal: "Today's Bookings",
      metricsGuestsTotal: "Expected Guests",
      metricsSeatedTotal: "Checked-in",
      metricsPendingTotal: "Awaiting Confirmation",
      restaurantOpenToday: "Restaurant Open Today",
      restaurantClosedToday: "Business Closed Today (Weekly Schedule)",
      noReservationsFound: "No bookings found",
      noReservationsDesc: "There are no bookings for this date with selected filters.",
      createNow: "Create Booking Now",
      statusConfirmed: "Confirmed",
      statusPending: "Pending",
      statusSeated: "Seated",
      statusCanceled: "Canceled",
      clientArrivedBtn: "Guest Arrived",
      confirmBtn: "Confirm",
      cancelBtn: "Cancel",
      tableOpenedInRoom: "Table Opened in Room",
      origin: "Channel",
      scheduleModalTitle: "Business Days & Operating Hours",
      scheduleModalDesc: "Set days open and shifts available for customer bookings.",
      slotInterval: "Time Slot Interval",
      maxGuestsSlot: "Max Capacity / Slot",
      closedDayWarning: "Closed days cannot be booked by guests or staff.",
      saveSchedule: "Save Hours",
      scheduleSavedSuccess: "Opening hours updated successfully!",
      newModalTitle: "New Table Booking",
      newModalDesc: "Book guests ensuring business open days are respected.",
      closedDayAlert: "The restaurant is closed on this day!",
      closedDayAlertDesc: "Please pick another open day of the week.",
      availableTimes: "Available Times",
      noTimesConfigured: "No shifts configured for this day in operating settings.",
      preferredArea: "Preferred Area",
      linkModalTitle: "Public Booking Link & Google Maps",
      linkModalDesc: "Allow customers to book online from Google Maps, WhatsApp or website",
      directLinkLabel: "Direct Link for Guests / Social Media:",
      howGoogleWorksTitle: "How does Reserve with Google work?",
      howGoogleWorksDesc: "On your Google Business Profile (Google Maps), you can add an official Reservation Link.",
      googleStep1: "Open your Google Business Profile on Google Maps.",
      googleStep2: "Click on Bookings > Add reservation link.",
      googleStep3: "Paste the copied link above.",
      googleTip: "Done! When guests search your venue on Google and tap 'Book a Table', they can only book on days your business is open!",
      checkInTitle: "Guest Check-in",
      checkInDesc: "Seat guests and open order bill on floor",
      checkInSelectTable: "Select Table to Seat:",
      checkInConfirmBtn: "Confirm Arrival & Seat",
      allTablesOccupied: "All tables are currently occupied!"
    },
    publicBooking: {
      pageTitle: "Online Table Reservation",
      pageSubtitle: "Secure your table easily",
      bookYourTableTitle: "Book Your Table",
      bookYourTableSubtitle: "Choose your date, time, and party size.",
      selectDateLabel: "Select Date *",
      selectTimeLabel: "Preferred Time *",
      selectGuestsLabel: "Party Size *",
      environmentLabel: "Seating Area",
      contactInfoLabel: "Contact Information",
      fullNamePlaceholder: "Full Name *",
      phonePlaceholder: "Phone / WhatsApp *",
      emailPlaceholder: "Email (optional)",
      notesPlaceholder: "Special requests (e.g. Birthday, high chair, allergies)",
      submitBtn: "Confirm My Reservation 🍽️",
      submittingBtn: "Confirming booking...",
      confirmedTitle: "Reservation Confirmed!",
      confirmedSubtitle: "We look forward to welcoming you to",
      holderLabel: "Guest Name:",
      dateLabel: "Date:",
      timeLabel: "Time:",
      guestsLabel: "Party Size:",
      arrivalNotice: "Please arrive within 15 minutes of your scheduled time. Call us if your plans change.",
      bookAnotherBtn: "Book Another Table",
      closedAlertTitle: "Restaurant is closed on this day!",
      closedAlertDesc: "Please select an open operating day to schedule your table."
    },
    tables: {
      title: "Floor & Table Management",
      subtitle: "Service, areas (Dining Room, Terrace, Bar), and capacity management.",
      qrPlates: "QR Signs",
      addBatchTables: "+ 6 Tables (Batch)",
      creating: "Creating...",
      newTable: "+ New Table",
      registeredTables: "Total Tables",
      occupiedTables: "Occupied Tables",
      freeTables: "Free Tables",
      openConsumption: "Open Tabs",
      allSectors: "ALL AREAS",
      occupied: "Occupied",
      free: "Free",
      calling: "Calling!",
      estDeparture: "Est. Departure:",
      items: "items",
      sendToKitchen: "to kitchen",
      openTable: "Open Table",
      reservationsToday: "Bookings"
    },
    analytics: {
      title: "Operations & Menu Intelligence",
      subtitle: "Demand curve, menu engineering, mise en place forecasting, and anti-waste radar.",
      badge: "Enterprise BI & Analytics",
      realtimeSync: "Real-time Synchronization",
      exportCsv: "Export Report (CSV)",
      biTab: "1. BI & Operations Intelligence",
      escandalloTab: "2. Cost Engineering & Recipe Costing (Margins & Profit)",
      filters: "Filters:",
      today: "Today",
      yesterday: "Yesterday",
      last7days: "Last 7 days",
      thisMonth: "This Month",
      allShifts: "All Shifts",
      lunchShift: "Lunch Shift (11am-4pm)",
      dinnerShift: "Dinner Shift (6pm-11pm)",
      allWaiters: "All Waiters",
      hourlyTitle: "Hourly Demand Curve (Sales €)",
      hourlySubtitle: "Spot slow hours for dynamic promotions and peak hours to staff accordingly.",
      bcgTitle: "Menu Engineering (Dynamic BCG Matrix)",
      bcgSubtitle: "Sales Volume vs. Contribution Margin per Dish.",
      stars: "Stars (High Sales + High Margin)",
      horses: "Plowhorses (High Sales + Low Margin)",
      puzzles: "Puzzles (Low Sales + High Margin)",
      dogs: "Dogs / Underperformers (Low Sales + Low Margin)",
      fefoTitle: "Anti-Waste Radar (FEFO / Critical Expirations)",
      fefoSubtitle: "Ingredients expiring within 3 days. Automated active selling promotion suggestions.",
      fefoBadge: "Urgent Consumption",
      miseEnPlaceTitle: "Smart Mise en Place Forecast",
      miseEnPlaceSubtitle: "Kitchen prep estimates based on day and shift sales history.",
      waiterRankingTitle: "Staff Performance & Productivity",
      waiterRankingSubtitle: "Ranking by sales volume, average ticket, and tables served."
    },
    escandallo: {
      title: "Cost Engineering & Recipe Costing (Escandallo)",
      subtitle: "Exact portion cost per raw ingredient, break-even price (zero loss), and profit margin simulation.",
      recipeSelection: "Analyzed Dish / Recipe:",
      category: "Category:",
      currentSalePrice: "Active Selling Price (incl. VAT):",
      targetMargin: "Target Gross Margin (%):",
      overheadPercent: "Operating Overhead (Labor/Utilities %):",
      vatRate: "VAT Rate (%):",
      ingredientsTitle: "Recipe Bill of Materials (Escandallo)",
      ingredientsDesc: "Adjust wholesale purchase prices and portion quantities in real time.",
      addCustomIngredient: "+ Manual Ingredient",
      addFromStock: "+ Ingredient from Stock",
      saveTechnicalSheet: "Save Recipe to System",
      saving: "Saving...",
      sheetSavedSuccess: "Recipe saved and linked to Stock inventory successfully!",
      colIngredient: "Ingredient",
      colWholesalePrice: "Wholesale Price",
      colWholesalePack: "Wholesale Package",
      colPortion: "Portion on Plate",
      colPortionCost: "Portion Cost",
      colOrigin: "Origin",
      colActions: "Actions",
      stockLinked: "Stock Connected",
      custom: "Manual",
      removeIngredient: "Remove ingredient",
      stockModalTitle: "Select Real Stock Ingredient",
      stockModalDesc: "Choose an item from your live inventory to auto-fill purchase cost and enable automatic sales deductions.",
      stockSearchPlaceholder: "Search inventory items...",
      noStockFound: "No matching items found in inventory.",
      stockBatch: "Batch:",
      stockAvailable: "Available:",
      stockCost: "Cost:",
      selectStockBtn: "Add to Recipe",
      kpiDirectCost: "Direct Food Cost (Raw Materials)",
      kpiGrossMargin: "Active Gross Margin",
      kpiNetProfit: "Unit Net Profit",
      kpiBreakeven: "Break-Even Price (Zero Loss)",
      suggestedPrice: "Suggested Price for Target Margin",
      lossAlert: "WARNING: This dish is currently operating at a LOSS! Price does not cover ingredients and operating costs."
    }
  }
};
