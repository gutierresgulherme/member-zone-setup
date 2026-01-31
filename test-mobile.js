/**
 * Mobile Viewport & Performance Test Script
 * 
 * Execute este script no console do navegador (F12 > Console)
 * com o DevTools aberto no modo mobile (iPhone 12 Pro)
 * 
 * URL: http://localhost:3001
 */

const runMobileTests = async () => {
    const results = {
        viewport: {},
        layout: {},
        touch: {},
        performance: {},
        supabase: {}
    };

    console.log('🧪 Iniciando Testes Mobile...\n');

    // ============ VIEWPORT TEST ============
    console.log('📱 1. VIEWPORT TEST');
    results.viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768,
        devicePixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window
    };
    console.log('   Largura:', results.viewport.width, 'px');
    console.log('   Altura:', results.viewport.height, 'px');
    console.log('   Mobile?', results.viewport.isMobile ? '✅ SIM' : '❌ NÃO');
    console.log('   Touch Support?', results.viewport.touchSupport ? '✅ SIM' : '⚠️ Emulado');
    console.log('');

    // ============ LAYOUT TEST ============
    console.log('🎨 2. LAYOUT TEST');

    // Check banner height
    const banner = document.querySelector('[class*="h-[60vh]"], [class*="h-[85vh]"]');
    if (banner) {
        const bannerRect = banner.getBoundingClientRect();
        const bannerHeightPercent = Math.round((bannerRect.height / window.innerHeight) * 100);
        results.layout.bannerHeight = bannerHeightPercent + '%';
        results.layout.bannerHeightOk = bannerHeightPercent >= 55 && bannerHeightPercent <= 90;
        console.log('   Banner Height:', results.layout.bannerHeight, results.layout.bannerHeightOk ? '✅' : '❌');
    } else {
        console.log('   Banner:', '⚠️ Não encontrado (pode estar na página de login)');
    }

    // Check carousels
    const carousels = document.querySelectorAll('[class*="overflow-x-auto"], [class*="snap-x"]');
    results.layout.carouselCount = carousels.length;
    console.log('   Carrosséis:', carousels.length > 0 ? `✅ ${carousels.length} encontrados` : '❌ Nenhum');

    // Check search button
    const searchBtn = document.querySelector('[aria-label*="Buscar"], button svg[class*="Search"]');
    results.layout.searchButton = !!searchBtn;
    console.log('   Search Button:', searchBtn ? '✅ Visível' : '⚠️ Não encontrado');

    // Check touch targets (44x44 minimum)
    const buttons = document.querySelectorAll('button');
    let smallButtons = 0;
    buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) smallButtons++;
    });
    results.layout.smallTouchTargets = smallButtons;
    console.log('   Touch Targets < 44px:', smallButtons === 0 ? '✅ Nenhum' : `⚠️ ${smallButtons} pequenos`);
    console.log('');

    // ============ TOUCH INTERACTIONS TEST ============
    console.log('👆 3. TOUCH INTERACTIONS');

    // Check scroll snap
    const snapContainers = document.querySelectorAll('.snap-x, [class*="snap-mandatory"]');
    results.touch.scrollSnap = snapContainers.length > 0;
    console.log('   Scroll Snap:', snapContainers.length > 0 ? '✅ Habilitado' : '❌ Não encontrado');

    // Check for touch-action: manipulation
    const touchManipElements = document.querySelectorAll('.touch-manipulation, [style*="touch-action"]');
    results.touch.touchManipulation = touchManipElements.length > 0;
    console.log('   Touch Manipulation:', touchManipElements.length > 0 ? '✅ Aplicado' : '⚠️ Não encontrado');

    // Check haptic support
    results.touch.hapticSupport = 'vibrate' in navigator;
    console.log('   Haptic Feedback:', results.touch.hapticSupport ? '✅ Disponível' : '⚠️ Não suportado');
    console.log('');

    // ============ PERFORMANCE TEST ============
    console.log('⚡ 4. PERFORMANCE METRICS');

    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
        results.performance.pageLoadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
        results.performance.domContentLoaded = Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart);
        results.performance.firstPaint = Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0);

        console.log('   Page Load:', results.performance.pageLoadTime, 'ms', results.performance.pageLoadTime < 3000 ? '✅' : '⚠️');
        console.log('   DOM Ready:', results.performance.domContentLoaded, 'ms');
        console.log('   First Paint:', results.performance.firstPaint, 'ms', results.performance.firstPaint < 1000 ? '✅' : '⚠️');
    }

    // Memory usage
    if (performance.memory) {
        results.performance.memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        console.log('   Memory Usage:', results.performance.memoryMB, 'MB');
    }
    console.log('');

    // ============ SUPABASE CONNECTION TEST ============
    console.log('🔌 5. SUPABASE CONNECTION');

    try {
        // Test if supabase is accessible
        const hasSupabase = typeof window !== 'undefined' &&
            (window.localStorage.getItem('lovable_user') ||
                document.cookie.includes('sb-'));
        results.supabase.sessionDetected = hasSupabase;
        console.log('   Session:', hasSupabase ? '✅ Detectada' : '⚠️ Não logado');

        // Check network requests to Supabase
        const perfEntries = performance.getEntriesByType('resource');
        const supabaseRequests = perfEntries.filter(e => e.name.includes('supabase.co'));
        results.supabase.apiCalls = supabaseRequests.length;
        console.log('   API Calls:', supabaseRequests.length > 0 ? `✅ ${supabaseRequests.length} requests` : '⚠️ Nenhum detectado');
    } catch (e) {
        console.log('   Erro:', e.message);
    }
    console.log('');

    // ============ SUMMARY ============
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(40));

    const allOk =
        results.viewport.isMobile &&
        results.layout.carouselCount > 0 &&
        results.touch.scrollSnap &&
        (results.performance.pageLoadTime < 3000 || !results.performance.pageLoadTime);

    if (allOk) {
        console.log('✅ MOBILE READY - Todos os testes críticos passaram!');
    } else {
        console.log('⚠️ VERIFICAR - Alguns testes precisam de atenção');
    }

    console.log('');
    console.log('Resultados completos:', results);

    return results;
};

// Execute os testes
runMobileTests();
