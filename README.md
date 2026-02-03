# mvc-test


/* --- 🍎 APPLE / IOS GLASS DESIGN (LIGHT & DARK) --- */

/* 1. Основен прозорец (The Glass Pane) */
/* --- СВЕТЪЛ РЕЖИМ (ПОДРАЗБИРАНЕ) --- */
.glass-modal {
    /* Млечно бяло, силно прозрачно за светлия режим */
    background: rgba(255, 255, 255, 0.65) !important; 
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.6) !important;
    border-radius: 24px !important;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1) !important; /* Мека сянка */
    color: #333 !important; /* Тъмен текст за светлия фон */
    padding: 30px !important;
}

/* --- ТЪМЕН РЕЖИМ (OVERRIDE) --- */
body.dark-mode .glass-modal {
    background: rgba(30, 30, 30, 0.60) !important; /* Тъмен прозрачен */
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5) !important;
    color: #fff !important; /* Бял текст */
}

/* Заглавие на прозореца */
#cookingModal h2 {
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 25px;
    color: #111; /* Черно за светъл режим */
}

body.dark-mode #cookingModal h2 {
    color: rgba(255, 255, 255, 0.95); /* Бяло за тъмен режим */
}

/* 2. Карти с рецепти вътре */
.recipe-result-card {
    /* Светъл режим: леко бяло върху бялото стъкло */
    background: rgba(255, 255, 255, 0.5); 
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 15px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Тъмен режим за картите */
body.dark-mode .recipe-result-card {
    background: rgba(255, 255, 255, 0.05); /* Почти прозрачно бяло */
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.recipe-result-card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

/* 3. Типография */

/* Заглавие на рецептата */
.recipe-title {
    font-size: 20px;
    font-weight: 700;
    margin-top: 0;
    color: #000; /* Черно за светъл режим */
}

body.dark-mode .recipe-title {
    color: #fff; /* Бяло за тъмен режим */
}

/* Описание и стъпки */
.recipe-desc, .recipe-steps-text {
    color: #555; /* Тъмно сиво за светъл режим */
    font-size: 14px;
    line-height: 1.6;
}

body.dark-mode .recipe-desc, 
body.dark-mode .recipe-steps-text {
    color: rgba(255, 255, 255, 0.7); /* Светло сиво за тъмен режим */
}

.recipe-steps-title {
    color: #333;
    font-weight: bold;
    font-size: 13px;
    text-transform: uppercase;
    margin-top: 20px;
}

body.dark-mode .recipe-steps-title {
    color: rgba(255, 255, 255, 0.9);
}

/* Хапчета за продукти (Used/Missing) */
.recipe-used, .recipe-missing {
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 20px;
    display: inline-block;
    margin-top: 5px;
    margin-bottom: 8px;
}

.recipe-used {
    background: rgba(46, 213, 115, 0.15);
    color: #27ae60; /* По-тъмно зелено за четливост на бяло */
    border: 1px solid rgba(46, 213, 115, 0.2);
}

body.dark-mode .recipe-used {
    background: rgba(46, 213, 115, 0.2);
    color: #2ed573; /* Ярко зелено за тъмен фон */
}

.recipe-missing {
    background: rgba(255, 71, 87, 0.15);
    color: #c0392b; /* По-тъмно червено за четливост */
    border: 1px solid rgba(255, 71, 87, 0.2);
}

body.dark-mode .recipe-missing {
    background: rgba(255, 71, 87, 0.2);
    color: #ff4757; /* Ярко червено за тъмен фон */
}

/* Разделителни линии */
hr {
    border: 0; height: 1px;
    background: rgba(0,0,0,0.1); /* Тъмна линия за светъл режим */
    margin: 20px 0;
}

body.dark-mode hr {
    background: rgba(255,255,255,0.1); /* Светла линия за тъмен режим */
}

/* Заглавия на секциите */
.section-exact, .section-partial {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 14px;
    margin-bottom: 15px;
    display: inline-block;
    padding-bottom: 5px;
}

.section-exact { color: #27ae60; border-bottom: 2px solid #27ae60; }
body.dark-mode .section-exact { color: #2ed573; border-bottom: 2px solid #2ed573; }

.section-partial { color: #e67e22; border-bottom: 2px solid #e67e22; margin-top: 30px; }
body.dark-mode .section-partial { color: #ffa502; border-bottom: 2px solid #ffa502; }

/* Бутон за затваряне (X) */
.close-cooking {
    background: rgba(0, 0, 0, 0.05); /* Лек фон */
    color: #333;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    transition: 0.2s;
    position: absolute; /* Уверяваме се, че е позициониран */
    top: 20px !important; right: 20px !important;
}

.close-cooking:hover { background: rgba(0, 0, 0, 0.1); }

body.dark-mode .close-cooking {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
body.dark-mode .close-cooking:hover { background: rgba(255, 255, 255, 0.2); }


v gotvene na recepti butona vrushtane nazad e cql red, trqq go napraq da ne e