html_content = """<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MPCST विस्तृत परियोजना प्रतिवेदन - राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0f3460;
            --primary-dark: #16213e;
            --secondary: #0284c7;
            --accent: #d97706;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border: #cbd5e1;
            --bg-page: #ffffff;
            --ans-color: #0f766e;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Mukta', 'Inter', sans-serif;
            background-color: #f1f5f9;
            color: var(--text-main);
            line-height: 1.5;
            padding: 20px;
        }

        .no-print-bar {
            max-width: 950px;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        .btn-print {
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 22px;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-print:hover {
            background: #e94560;
        }

        .page-sheet {
            max-width: 950px;
            margin: 0 auto 24px auto;
            background: var(--bg-page);
            padding: 40px 48px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
            min-height: 1200px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
        }

        .page-footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--text-muted);
        }

        .page-header-box {
            border-bottom: 2px solid var(--primary);
            padding-bottom: 12px;
            margin-bottom: 20px;
        }

        .page-title {
            font-size: 20px;
            font-weight: 800;
            color: var(--primary);
        }

        .page-subtitle {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .qa-block {
            margin-bottom: 14px;
        }

        .q-text {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
        }

        .a-text {
            font-size: 13.5px;
            color: #334155;
            background: #f8fafc;
            padding: 8px 12px;
            border-radius: 5px;
            border-left: 3px solid var(--ans-color);
            text-align: justify;
            white-space: pre-line;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 12.5px;
        }

        th, td {
            padding: 8px 10px;
            border: 1px solid var(--border);
            text-align: left;
        }

        th {
            background-color: var(--primary);
            color: white;
            font-weight: 700;
        }

        tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        .table-total {
            background-color: #e0f2fe !important;
            font-weight: 800;
            color: var(--primary-dark);
        }

        /* Cover Page Specials */
        .cover-page {
            text-align: center;
            justify-content: center;
            gap: 24px;
        }

        .cover-top {
            margin-top: 40px;
        }

        .cover-gov {
            font-size: 26px;
            font-weight: 800;
            color: var(--primary);
        }

        .cover-scheme {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 6px 18px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
            margin-top: 8px;
        }

        .cover-box {
            background: linear-gradient(135deg, #0f3460, #16213e);
            color: white;
            padding: 36px 24px;
            border-radius: 10px;
            margin: 30px 0;
            border: 2px solid #38bdf8;
        }

        .cover-box h1 {
            font-size: 28px;
            color: #38bdf8;
            margin-bottom: 10px;
        }

        .cover-org {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 24px;
            border-radius: 8px;
            margin-top: 20px;
        }

        .cover-org h2 {
            font-size: 22px;
            color: var(--primary);
            margin-bottom: 8px;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .no-print-bar {
                display: none !important;
            }
            .page-sheet {
                box-shadow: none;
                border: none;
                padding: 24px;
                margin: 0;
                min-height: 100vh;
                page-break-after: always;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-bar">
        <div>
            <strong>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</strong> — MPCST 15-पेज प्रोजेक्ट रिपोर्ट
        </div>
        <button class="btn-print" onclick="window.print()">
            🖨️ 15-पेज संपूर्ण रिपोर्ट प्रिंट / PDF सेव करें
        </button>
    </div>

    <!-- PAGE 1: COVER PAGE -->
    <div class="page-sheet cover-page">
        <div>
            <div class="cover-gov">मध्यप्रदेश विज्ञान एवं प्रौद्योगिकी परिषद (MPCST), भोपाल</div>
            <div style="font-size: 13px; color: var(--text-muted);">विज्ञान भवन, नेहरू नगर, भोपाल - 462 003 | www.mpcost.nic.in</div>
            <div class="cover-scheme">विज्ञान के प्रचार प्रसार / विज्ञान लोकव्यापीकरण योजना</div>

            <div class="cover-box">
                <div style="font-size: 14px; font-weight: 700; color: #fef08a; letter-spacing: 1px; margin-bottom: 8px;">विस्तृत परियोजना प्रतिवेदन (DETAILED PROJECT REPORT)</div>
                <h1>शाला के विद्यार्थियों की विज्ञान प्रतियोगिता</h1>
                <div style="font-size: 16px; color: #e2e8f0; margin-bottom: 14px;">3-दिवसीय ग्रामीण विज्ञान संवर्धन कार्यशाला, हैंड्स-ऑन मॉडल निर्माण एवं विज्ञान प्रश्नमंच</div>
                <div style="font-size: 14px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; color: #bae6fd;">
                    लक्षित वर्ग: कक्षा 6वीं से 12वीं के स्कूली विद्यार्थी | अवधि: 3 दिवस | भाषा: हिन्दी / अंग्रेजी<br>
                    <strong>कुल प्रस्तावित बजट: ₹ 2,35,000/- (दो लाख पैंतीस हजार रुपये मात्र)</strong>
                </div>
            </div>

            <div class="cover-org">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">प्रस्तुतकर्ता अधिकृत संस्था</div>
                <h2>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान</h2>
                <div style="font-size: 13.5px; color: #475569; line-height: 1.6;">
                    <strong>पंजीयन क्रमांक:</strong> 04/14/07/15659/13 (म.प्र. सोसायटी रजिस्ट्रीकरण अधिनियम 1973)<br>
                    <strong>नीति आयोग दर्पण आईडी (NGO Darpan ID):</strong> MP/2023/0342298<br>
                    <strong>कार्यालय पता:</strong> वार्ड क्र. 66 कजरवारा नई बस्ती, शिवपुरी न्यू बस्ती, जिला- जबलपुर (म.प्र.) - 482001<br>
                    <strong>मोबाईल:</strong> +91 8770375392 | <strong>ईमेल:</strong> Sushiljasele2@gmail.com / rashtriyabhakti2013@gmail.com<br>
                    <strong>वेबसाइट:</strong> https://rashtrabhakti.ngo-india.org
                </div>
            </div>
        </div>

        <div class="page-footer">
            <span>मध्यप्रदेश विज्ञान एवं प्रौद्योगिकी परिषद (MPCST)</span>
            <span>पृष्ठ 1 / 15 (कवर पृष्ठ)</span>
        </div>
    </div>

    <!-- PAGE 2: PROFILE -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">संस्था का विस्तृत परिचय एवं वैधानिक विवरण</div>
                <div class="page-subtitle">RASHTRA BHAKTI VISHTHAPIT JAN KALYAN SHIKSHA SANSTHAN - PROFILE</div>
            </div>

            <table>
                <tbody>
                    <tr><td style="width: 35%; font-weight: bold; background: #f8fafc;">संस्था का नाम (Full Name)</td><td>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">पंजीयन अधिनियम व क्रमांक</td><td>मध्यप्रदेश सोसायटी रजिस्ट्रीकरण अधिनियम, 1973 अंतर्गत क्र. 04/14/07/15659/13</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">पंजीयन दिनांक व वर्ष</td><td>02 सितम्बर 2013 (विगत 13+ वर्षों से निरंतर सेवारत)</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">पंजीयन प्राधिकारी</td><td>सहायक पंजीयक, फर्म्स एवं संस्थाएं, जबलपुर संभाग (म.प्र.)</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">नीति आयोग दर्पण रजिस्ट्रेशन</td><td>MP/2023/0342298 (पंजीयन दिनांक: 01 अप्रैल 2023)</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">पंजीकृत प्रधान कार्यालय</td><td>वार्ड क्र. 66 कजरवारा नई बस्ती, शिवपुरी न्यू बस्ती, जिला- जबलपुर (म.प्र.) - 482001</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">संस्था के अध्यक्ष / चेयरमैन</td><td>श्री सुशील कुमार जसेले (Mr. Sushil Kumar Jasele) - मो. 8770375392</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">संस्था के सचिव (Secretary)</td><td>श्री विवेक कुमार सोनी (Mr. Vivek Kumar Soni)</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">संस्था की उपाध्यक्ष</td><td>श्रीमती रंजीता जी (Mrs. Ranjita Ji)</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">अधिकृत ईमेल व वेबसाइट</td><td>Sushiljasele2@gmail.com | https://rashtrabhakti.ngo-india.org</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">बैंक विवरण (HDFC Bank)</td><td>HDFC Bank, शाखा: शिविर गार्डन, मंडला रोड, जबलपुर | खाता: 50100589705423 | IFSC: HDFC0007168</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">अन्य वैधानिक सम्बद्धताएं</td><td>मध्यप्रदेश जन अभियान परिषद (MPJAP), FSSAI, भारतीय जीव जन्तु कल्याण बोर्ड (AWBI)</td></tr>
                    <tr><td style="font-weight: bold; background: #f8fafc;">मुख्य कार्यक्षेत्र</td><td>शिक्षा, विज्ञान प्रचार, महिला सशक्तिकरण, कौशल विकास, विस्थापित जन कल्याण, पर्यावरण संरक्षण</td></tr>
                </tbody>
            </table>

            <div style="margin-top: 14px; font-size: 13.5px; background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid var(--primary);">
                <strong>संस्था का ध्येय एवं विजन (Vision & Mission):</strong><br>
                संस्था का मुख्य ध्येय 'अन्त्योदय' और राष्ट्र सेवा की भावना से समाज के अंतिम पंक्ति के नागरिकों, ग्रामीण बच्चों एवं विस्थापित परिवारों तक आधुनिक शिक्षा, वैज्ञानिक दृष्टिकोण और कौशल विकास के अवसर पहुंचाना है। संस्था मध्य प्रदेश में पारंपरिक संस्कारों के साथ आधुनिक विज्ञान व तकनीकी शिक्षा का समन्वय स्थापित करने हेतु पूर्ण निष्ठा से समर्पित है।
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 2 / 15</span>
        </div>
    </div>

    <!-- PAGE 3: QUESTIONNAIRE PART 1 (QUESTIONS 1 TO 4.6) -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">कार्यकम हेतु प्रपत्र - प्राथमिक विवरण</div>
                <div class="page-subtitle">QUESTIONS 1 TO 4.6: ORGANISATION & PROGRAMME PARTICULARS</div>
            </div>

            <div class="qa-block">
                <div class="q-text">1. संस्था का नाम (Name of the Organisation):</div>
                <div class="a-text">राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर (मध्यप्रदेश)
पंजीयन क्रमांक: 04/14/07/15659/13 | नीति आयोग दर्पण आईडी: MP/2023/0342298</div>
            </div>

            <div class="qa-block">
                <div class="q-text">2. विभाग का नाम (यदि शासकीय हो) (Name of the Department):</div>
                <div class="a-text">लागू नहीं (संस्था मध्यप्रदेश सोसायटी रजिस्ट्रीकरण अधिनियम, 1973 के अंतर्गत पंजीकृत एक अशासकीय स्वयंसेवी संस्था है)।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">3. कार्यक्रम समन्वयक का नाम, पता, फोन, ई-मेल एवं पद (Programme Co-ordinator Details):</div>
                <div class="a-text">नाम: श्री सुशील कुमार जसेले
पद: अध्यक्ष एवं अधिकृत कार्यक्रम समन्वयक
पता: वार्ड क्र. 66 कजरवारा नई बस्ती, शिवपुरी न्यू बस्ती, जिला- जबलपुर, मध्य प्रदेश - 482001
फोन / मोबाइल: +91 8770375392 | ई-मेल: Sushiljasele2@gmail.com / rashtriyabhakti2013@gmail.com</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.1 प्रस्तावित कार्यक्रम का नाम (Name of the Proposed Programme):</div>
                <div class="a-text">शाला के विद्यार्थियों की विज्ञान प्रतियोगिता
(3-दिवसीय ग्रामीण विज्ञान संवर्धन शिविर, हैंड्स-ऑन मॉडल निर्माण कार्यशाला एवं विज्ञान प्रश्नमंच)</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.2 स्थान, जिला, राज्य (Place, District, State):</div>
                <div class="a-text">स्थान: शासकीय उच्चतर माध्यमिक विद्यालय प्रांगण / सामुदायिक भवन परिसर
जिला: जबलपुर | राज्य: मध्य प्रदेश</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.3 कार्यक्रम अवधि (कार्य योजना के साथ) (Duration of Programme):</div>
                <div class="a-text">कुल अवधि: 3 दिवस (3 Days Intensive Science Workshop & Competition)
दिनांक: परिषद द्वारा स्वीकृति एवं अनुदान आवंटन के 30 दिवस के भीतर निर्धारित तिथियों में।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.4 लक्ष्य समूह में सामान्यजन / विद्यार्थी (Target Group):</div>
                <div class="a-text">कक्षा 6वीं से 12वीं तक के शासकीय एवं ग्रामीण शालाओं के नियमित विद्यार्थी (विशेष रूप से दूरदराज के वंचित क्षेत्रों के बच्चे)।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.5 भाषा (हिन्दी/अंग्रेजी/अन्य) (Language):</div>
                <div class="a-text">हिन्दी एवं अंग्रेजी (व्याख्यान एवं कार्यशाला की मुख्य अभिव्यक्ति सरल एवं सुबोध हिन्दी में होगी)।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.6 हितग्राहियों / लाभान्वितों की अनुमानित संख्या (Expected Beneficiaries):</div>
                <div class="a-text">कुल अनुमानित प्रतिभागी: 200+ विद्यार्थी
• सामान्य (General) - छात्र: 35 | छात्राएं: 35 (कुल: 70)
• अनुसूचित जनजाति (ST / आदिवासी) - छात्र: 30 | छात्राएं: 30 (कुल: 60)
• अनुसूचित जाति (SC / आदिमजाति) - छात्र: 25 | छात्राएं: 25 (कुल: 50)
• अन्य पिछड़ा वर्ग (OBC) - छात्र: 10 | छात्राएं: 10 (कुल: 20)
विशेष टिप्पणी: कार्यक्रम में 50% से अधिक बालिकाओं (Girls) की सक्रिय भागीदारी सुनिश्चित की जाएगी।</div>
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 3 / 15</span>
        </div>
    </div>

    <!-- PAGE 4: QUESTION 4.7 -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">कार्यक्रम की भूमिका, उद्देश्य सहित संक्षेपिका</div>
                <div class="page-subtitle">QUESTION 4.7: SUMMARY OF THE PROGRAMME & OBJECTIVES (न्यूनतम 200 शब्दों में)</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.7 कार्यक्रम की भूमिका, उद्देश्य सहित संक्षेपिका (न्यूनतम 200 शब्दों में):</div>
                <div class="a-text" style="font-size: 13.5px; line-height: 1.6;">राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर विगत 13 वर्षों से मध्य प्रदेश के ग्रामीण, उपनगरीय और दूरदराज के विस्थापित क्षेत्रों में शिक्षा के प्रचार-प्रसार, बाल कल्याण एवं सामाजिक उत्थान हेतु निरंतर कार्यरत है। अपने जमीनी अनुभवों के दौरान संस्था ने पाया है कि ग्रामीण अंचलों के स्कूली बच्चों में सीखने की असीम जिज्ञासा और स्वाभाविक प्रतिभा होती है, परंतु संसाधनों, आधुनिक विज्ञान प्रयोगशालाओं और व्यावहारिक उपकरणों के अभाव में उनकी विज्ञान शिक्षा केवल पाठ्यपुस्तकों और सैद्धांतिक रटने तक सीमित रह जाती है। वे विज्ञान को केवल परीक्षा उत्तीर्ण करने का एक कठिन विषय मान लेते हैं, जिसके कारण उनमें तार्किक सोच, वैज्ञानिक दृष्टिकोण और नवाचार (Innovation) की क्षमता पूर्ण रूप से विकसित नहीं हो पाती।

इस खाई को पाटने के लिए यह 3-दिवसीय 'शाला के विद्यार्थियों की विज्ञान प्रतियोगिता एवं नवाचार शिविर' हमारी एक समर्पित पहल है। हमारा उद्देश्य बच्चों को 3 दिनों तक एक ऐसा प्रेरक और आनंददायी माहौल प्रदान करना है जहाँ वे 'खेल-खेल में विज्ञान' सीख सकें। इस शिविर में बच्चे केवल श्रोता नहीं रहेंगे, बल्कि अपने हाथों से छोटे-छोटे प्रयोग करेंगे, विज्ञान मॉडल बनाएंगे, वैज्ञानिक क्विज में प्रतिस्पर्धा करेंगे और अपने बनाए मॉडल्स को निर्णायक मंडल व जनसमुदाय के समक्ष आत्मविश्वास के साथ प्रस्तुत करेंगे।

<strong>कार्यक्रम के मुख्य उद्देश्य (Key Objectives):</strong>
1. <strong>वैज्ञानिक चेतना का विकास:</strong> बच्चों के मन से अंधविश्वास, हिचकिचाहट और विज्ञान के प्रति डर को समाप्त कर उनमें तर्कसंगत व खोजी प्रवृत्ति को जाग्रत करना।
2. <strong>हैंड्स-ऑन लर्निंग एवं सिद्धांतों की समझ:</strong> प्रकाश, ध्वनि, चुंबकत्व, साधारण विद्युत परिपथ और ऊर्जा सिद्धांतों को स्वयं मॉडलों के माध्यम से प्रत्यक्ष अनुभव कराकर सिखाना।
3. <strong>आत्मविश्वास एवं सार्वजनिक मंच प्रस्तुति:</strong> ग्रामीण बच्चों को अपने बनाए विज्ञान मॉडल्स को मंच पर सबके सामने समझाने और प्रश्नों के उत्तर देने का अवसर देकर उनके आत्मबल में वृद्धि करना।
4. <strong>स्थानीय समस्याओं के वैज्ञानिक समाधान की प्रेरणा:</strong> ग्रामीण परिवेश की प्रमुख चुनौतियों जैसे सौर ऊर्जा, जल संरक्षण, वर्षा जल संचयन और अपशिष्ट प्रबंधन से विज्ञान को जोड़कर व्यवहारिक समाधान विकसित करना।
5. <strong>टीम वर्क एवं नेतृत्व कौशल (Leadership):</strong> समूह प्रतियोगिताओं और दलगत मॉडल निर्माण के माध्यम से बच्चों में परस्पर सहयोग और मिल-जुलकर काम करने की क्षमता का विकास करना।</div>
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 4 / 15</span>
        </div>
    </div>

    <!-- PAGE 5: QUESTIONS 4.8 TO 4.11 -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">सहयोगी संस्थाएं, सामग्री, कौशल एवं क्षेत्रीय आवश्यकता</div>
                <div class="page-subtitle">QUESTIONS 4.8 TO 4.11: OPERATIONAL & REGIONAL ANALYSIS</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.8 सहयोगी संस्थाओं के नाम (Name of Collaborating Agencies):</div>
                <div class="a-text">1. स्थानीय शासकीय माध्यमिक एवं उच्चतर माध्यमिक विद्यालय, जिला जबलपुर (म.प्र.)
2. जिला शिक्षा विभाग / समग्र शिक्षा अभियान, जबलपुर
3. मध्यप्रदेश जन अभियान परिषद (MPJAP) की स्थानीय प्रस्फुटन समितियां</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.9 कार्यक्रम / प्रशिक्षण के दौरान उपयोग की जाने वाली सामग्री / किट / उपकरण:</div>
                <div class="a-text">• विज्ञान मॉडल मेकिंग किट्स: छोटे डीसी बल्ब, कनेक्टिंग वायर्स, स्विच, 9V बैटरियां, सेल होल्डर्स, डीसी मोटर्स, पंखे, एलईडी।
• प्रकाश एवं प्रकाशिकी सामग्री: समतल दर्पण, अवतल एवं उत्तल दर्पण, प्रिज्म, मैग्नीफाइंग ग्लास, लेजर डायोड।
• ध्वनि एवं तरंग मॉडल: पेपर कप्स, रेजोनेंस स्ट्रिंग्स, ट्यूनिंग फॉर्क, रबर बैंड्स, प्लास्टिक पाइप्स।
• पर्यावरण एवं ऊर्जा मॉडल: मिट्टी, क्ले, कार्डबोर्ड शीट्स, थर्माकोल, फेविकोल, सौर सेल (मिनी सोलर पैनल), वाटर लेवल इंडिकेटर किट्स।
• तकनीकी एवं डिजिटल उपकरण: लैपटॉप, फुल एचडी प्रोजेक्टर, पोर्टेबल साउंड सिस्टम (माइक व स्पीकर), एक्सटेंशन बोर्ड्स।
• स्टेशनरी व मूल्यांकन सामग्री: नोटबुक, पेन, ड्राइंग शीट्स, चार्ट पेपर, मार्कर्स, प्रश्नमंच बज़र सिस्टम, फोल्डर्स एवं प्रमाण-पत्र।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.10 प्रशिक्षण कार्यक्रम में कौशल विकास (Development of Skill in the Programme):</div>
                <div class="a-text">इस 3-दिवसीय कार्यक्रम से ग्रामीण विद्यार्थियों में निम्नलिखित 6 प्रमुख कौशलों का सर्वांगीण विकास होगा:
1. तार्किक एवं विश्लेषणात्मक चिंतन (Analytical & Critical Thinking)
2. व्यावहारिक समस्या समाधान कौशल (Hands-on Problem Solving Skills)
3. नवाचार एवं सृजनशीलता (Innovation & Scientific Creativity)
4. सहयोगात्मक कार्य एवं टीम भावना (Teamwork & Collaboration)
5. मंच प्रस्तुति एवं नेतृत्व क्षमता (Public Speaking & Leadership Qualities)
6. डिजिटल एवं पर्यावरणीय साक्षरता (Digital & Environmental Consciousness)</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.11 क्षेत्र की स्थानीय आवश्यकता / समस्या क्या है (Local Needs / Problem of Area):</div>
                <div class="a-text">जबलपुर जिले के ग्रामीण एवं उपनगरीय अंचलों में शासकीय शालाओं में अध्ययनरत अधिकांश विद्यार्थी आर्थिक रूप से कमजोर, श्रमिक, विस्थापित अथवा आदिवासी परिवारों से आते हैं। इन शालाओं में नियमित विज्ञान प्रयोगशालाओं, आधुनिक प्रायोगिक उपकरणों तथा हैंड्स-ऑन प्रशिक्षण की अत्यधिक कमी है। इसके परिणामस्वरूप बच्चे केवल परीक्षा उत्तीर्ण करने हेतु विज्ञान के सूत्रों को रटते हैं परंतु उनका व्यावहारिक उपयोग नहीं समझ पाते।

साथ ही, ग्रामीण क्षेत्रों में इंटरनेट और डिजिटल उपकरणों की पहुंच सीमित होने के कारण विद्यार्थी आधुनिक वैज्ञानिक आविष्कारों से अनभिज्ञ रहते हैं। जल संरक्षण, सौर ऊर्जा तथा स्थानीय समस्याओं के प्रति वैज्ञानिक समझ का अभाव रहता है। यह कार्यक्रम इन कमियों को दूर कर ग्रामीण प्रतिभाओं को मुख्यधारा से जोड़ने की दिशा में एक अत्यंत आवश्यक और सामयिक कदम है।</div>
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 5 / 15</span>
        </div>
    </div>

    <!-- PAGE 6: QUESTIONS 4.12 TO 4.15 -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">मॉनिटरिंग, रिसोर्स पर्सन एवं संस्था की सुविधाएं</div>
                <div class="page-subtitle">QUESTIONS 4.12 TO 4.15: MONITORING, EXPERTS & INFRASTRUCTURE</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.12 प्रस्तावित परियोजना के लिये मॉनीटरिंग प्रक्रिया क्या होगी? (Monitoring Process):</div>
                <div class="a-text">परिषद (MPCST) के नियमों के अक्षरशः अनुपालन हेतु पारदर्शी एवं त्रि-स्तरीय मॉनिटरिंग व्यवस्था लागू की जाएगी:
1. पूर्व सूचना: कार्यक्रम प्रारंभ होने से 15 दिवस पूर्व परिषद एवं जिला प्रशासन को तिथियों व स्थल की लिखित सूचना दी जाएगी।
2. दैनिक उपस्थिति प्रमाणीकरण: प्रतिदिन भाग लेने वाले प्रत्येक छात्र-छात्रा का नाम, कक्षा, शाला, वर्ग तथा हस्ताक्षर युक्त दैनिक उपस्थिति पंजिका (Register) संधारित की जाएगी।
3. सत्रवार गतिविधि लॉग: प्रतिदिन की कार्यशाला, क्विज राउंड्स, और मॉडल मेकिंग का विवरण रजिस्टर में दर्ज किया जाएगा।
4. फोटोग्राफिक दस्तावेजीकरण: कार्यक्रम के प्रत्येक सत्र की हाई-रेजोल्यूशन तस्वीरें ली जाएंगी।
5. अंतिम संकलन एवं प्रतिवेदन: कार्यक्रम संपन्न होने के 15 दिवस के भीतर व्यय के मूल वाउचर्स, उपयोगिता प्रमाण-पत्र (UC), फोटोग्राफ्स एवं विस्तृत निष्पादन रिपोर्ट परिषद (MPCST) भोपाल को प्रेषित की जाएगी।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.13 प्रस्तावित कार्यक्रम / प्रकल्प के लिए रिसोर्स पर्सन के नाम (Resource Persons):</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 8%;">क्र.</th>
                            <th style="width: 25%;">नाम एवं पता</th>
                            <th style="width: 27%;">शैक्षिक योग्यता</th>
                            <th>अनुभव एवं विशेषज्ञता</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>1</td><td>डॉ. आर. के. शर्मा, जबलपुर</td><td>एम.एससी., पीएच.डी. (भौतिकी)</td><td>20+ वर्ष का अनुभव, विज्ञान प्रसार एवं नवाचार मॉडल विशेषज्ञ</td></tr>
                        <tr><td>2</td><td>प्रो. एस. एन. वर्मा, सिहोरा</td><td>एम.एससी. (रसायन), बी.एड.</td><td>15 वर्ष का अनुभव, हैंड्स-ऑन साइंस किट्स प्रशिक्षक</td></tr>
                        <tr><td>3</td><td>इंजी. दीपक पटेल, जबलपुर</td><td>बी.ई. (इलेक्ट्रॉनिक्स), एम.टेक.</td><td>10 वर्ष का अनुभव, सौर ऊर्जा एवं डिजिटल टेक्नोलॉजी ट्रेनर</td></tr>
                        <tr><td>4</td><td>श्रीमती सुनीता जैन, जबलपुर</td><td>एम.एससी. (पर्यावरण विज्ञान)</td><td>12 वर्ष का अनुभव, जल संचयन एवं अपशिष्ट प्रबंधन विशेषज्ञ</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="qa-block">
                <div class="q-text">4.14 संस्था में उपलब्ध सुविधाएं (Infrastructure Available):</div>
                <div class="a-text">• भौतिक फर्नीचर: टेबल्स (25+), कुर्सियां (150+), पोडियम, डिस्प्ले बोर्ड्स, स्टेज सेटअप।
• ऑडियो-विजुअल उपकरण: एम्प्लीफायर, कॉर्डलेस व कॉलर माइक्स, स्पीकर्स, टीवी स्क्रीन।
• आईटी उपकरण: लैपटॉप (03), डेस्कटॉप कंप्यूटर (05), हाई-स्पीड लेजर प्रिंटर व स्कैनर।
• कनेक्टिविटी: हाई-स्पीड ब्रॉडबैंड वाई-फाई इंटरनेट कनेक्शन, यूपीएस इन्वर्टर पावर बैकअप।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">4.15 संस्था की अन्य जिलों में शाखाएं (Branches in Other Districts):</div>
                <div class="a-text">संस्था का प्रधान कार्यालय जबलपुर में स्थित है तथा महाकौशल संभाग के पड़ोसी जिलों (कटनी, मंडला, डिंडौरी एवं नरसिंहपुर) में संस्था के वालंटियर नेटवर्क्स एवं सहयोगी केंद्र सक्रिय हैं।</div>
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 6 / 15</span>
        </div>
    </div>

    <!-- PAGE 7: QUESTION 7 -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">कार्यक्रम में विज्ञान एवं प्रौद्योगिकी का निवेश</div>
                <div class="page-subtitle">QUESTION 7: INPUT OF SCIENCE & TECHNOLOGY (न्यूनतम 200 शब्दों में)</div>
            </div>

            <div class="qa-block">
                <div class="q-text">7. कार्यक्रम में विज्ञान एवं प्रौद्योगिकी का निवेश क्या है? (न्यूनतम 200 शब्दों में):</div>
                <div class="a-text" style="font-size: 13.5px; line-height: 1.6;">प्रस्तुत कार्यक्रम की संपूर्ण संरचना विज्ञान एवं प्रौद्योगिकी (Science & Technology) के व्यावहारिक एवं अनुभवात्मक निवेश (Experiential Input) पर आधारित है। हमारा दृढ़ विश्वास है कि विज्ञान रटने की वस्तु नहीं, बल्कि जीवन जीने और प्रकृति को समझने की एक वैज्ञानिक पद्धति है। इस कार्यक्रम के माध्यम से हम विद्यार्थियों को कक्षा की चारदीवारी से बाहर निकालकर सीधे विज्ञान के सिद्धांतों से साक्षात्कार कराएंगे।

1. <strong>भौतिकी एवं प्रकाशिकी का व्यावहारिक निवेश:</strong> प्रकाश के परावर्तन (Reflection), अपवर्तन (Refraction) तथा वर्ण विक्षेपण (Dispersion) के सिद्धांतों को समतल, अवतल व उत्तल दर्पणों तथा प्रिज्म के माध्यम से प्रत्यक्ष समझाया जाएगा। विद्यार्थी स्वयं दर्पणों से प्रकाश किरण का पथ मोड़कर और प्रिज्म से इंद्रधनुषी सात रंगों का निर्माण करके प्रकाश के नियमों को सिद्ध करेंगे।

2. <strong>विद्युत, चुंबकत्व एवं इलेक्ट्रॉनिक्स इनपुट:</strong> विद्यार्थी साधारण बैटरी, कनेक्टिंग वायर, स्विच और डीसी मोटर का उपयोग करके स्वयं पूर्ण विद्युत परिपथ (Closed Circuit), सीरीज एवं पैरेलल कनेक्शन बनाएंगे। वे समझेंगे कि विद्युत धारा कैसे प्रवाहित होती है और मोटर द्वारा विद्युत ऊर्जा को यांत्रिक ऊर्जा में कैसे बदला जाता है।

3. <strong>पर्यावरण एवं हरित ऊर्जा नवाचार (Green Energy):</strong> सौर ऊर्जा (Solar Energy) के सिद्धांत को समझाने हेतु लघु सोलर पैनल से एलईडी बल्ब और पंखा चलाकर दिखाया जाएगा। इसके साथ ही वर्षा जल संचयन (Rainwater Harvesting) के वर्किंग मॉडल्स और स्थानीय मिट्टी व रीसायकल्ड सामग्री से अपशिष्ट प्रबंधन के वैज्ञानिक तरीके सिखाए जाएंगे।

4. <strong>डिजिटल तकनीक एवं मल्टीमीडिया का समावेश:</strong> लैपटॉप और प्रोजेक्टर के माध्यम से बच्चों को इसरो के चंद्रयान अभियान, उपग्रहों की कार्यप्रणाली और रोबोटिक्स से संबंधित रोचक वैज्ञानिक एनिमेशन दिखाए जाएंगे, जिससे उनमें तकनीकी सोच का विस्तार होगा।</div>
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 7 / 15</span>
        </div>
    </div>

    <!-- PAGE 8: QUESTIONS 8 & 9 -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">फील्ड समूह एवं मध्यप्रदेश के लिये उपयोगिता</div>
                <div class="page-subtitle">QUESTIONS 8 & 9: FIELD GROUP & UTILITY FOR MADHYA PRADESH (न्यूनतम 200 शब्दों में)</div>
            </div>

            <div class="qa-block">
                <div class="q-text">8. फील्ड समूह की जानकारी (Information about Field Groups):</div>
                <div class="a-text">कक्षा 6वीं से 12वीं तक के शासकीय एवं ग्रामीण शालाओं के नियमित विद्यार्थी (विशेष रूप से जबलपुर जिले के ग्रामीण एवं उपनगरीय विकासखंडों के छात्र-छात्राएं)।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">9. प्रस्तावित कार्यक्रम / परियोजना की मध्यप्रदेश के लिये उपयोगिता (Utility for MP State):</div>
                <div class="a-text" style="font-size: 13.5px; line-height: 1.6;">यह परियोजना मध्य प्रदेश राज्य के ग्रामीण विकास, शैक्षिक उन्नयन एवं भविष्य की वैज्ञानिक प्रतिभाओं को तराशने की दिशा में अत्यंत दूरगामी और प्रभावी साबित होगी। इसका सीधा लाभ प्रदेश के शैक्षिक परिदृश्य को निम्नलिखित रूपों में प्राप्त होगा:

1. <strong>ग्रामीण शिक्षा की गुणवत्ता में क्रांतिकारी सुधार:</strong> मध्य प्रदेश के ग्रामीण क्षेत्रों में विज्ञान के व्यावहारिक संसाधनों की भारी कमी है। यह कार्यक्रम इन विद्यालयों में विज्ञान शिक्षण को रुचिकर और जीवंत बनाएगा, जिससे बच्चों के परीक्षा परिणामों और विषय की बुनियादी समझ में व्यापक सुधार होगा।

2. <strong>भविष्य के वैज्ञानिकों एवं हुनरमंद युवाओं का निर्माण:</strong> जब ग्रामीण बच्चों में कम उम्र से ही मॉडल बनाने, प्रश्न पूछने और नई चीजें गढ़ने की जिज्ञासा जाग्रत होगी, तो वे आगे चलकर केवल नौकरी तलाशने वाले नहीं, बल्कि स्थानीय समस्याओं का वैज्ञानिक समाधान निकालने वाले शोधकर्ता, आविष्कारक और तकनीकी उद्यमी बनेंगे। इससे राज्य के औद्योगिक व तकनीकी विकास को गति मिलेगी।

3. <strong>सतत विकास लक्ष्यों (SDGs) की प्राप्ति में योगदान:</strong> मध्य प्रदेश शासन के पर्यावरण संरक्षण, जल शक्ति अभियान तथा अक्षय ऊर्जा संवर्धन के लक्ष्यों को यह कार्यक्रम बाल स्तर पर जमीनी चेतना प्रदान करेगा। बच्चे अपने घरों और गांवों में पानी बचाने, बिजली बचाने और कचरा प्रबंधन के प्रति वैज्ञानिक जागरूकता के अग्रदूत बनेंगे।

4. <strong>सामाजिक समानता एवं बालिका सशक्तिकरण:</strong> इस कार्यक्रम में 50% से अधिक ग्रामीण बालिकाओं तथा एससी/एसटी वर्ग के बच्चों को समान अवसर और मंच प्रदान किया जा रहा है, जिससे सामाजिक समावेशिता और 'डिजिटल व साइंटिफिक डिवाइड' को समाप्त करने में राज्य शासन की नीतियों को सशक्त बल मिलेगा।</div>
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 8 / 15</span>
        </div>
    </div>

    <!-- PAGE 9: 3-DAY SCHEDULE -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">तीन-दिवसीय विस्तृत कार्ययोजना एवं दैनिक गतिविधि सारणी</div>
                <div class="page-subtitle">DETAILED 3-DAY STEP-BY-STEP ACTIVITY SCHEDULE</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 18%;">दिवस एवं सत्र</th>
                        <th style="width: 22%;">समय</th>
                        <th>गतिविधि, विषय एवं शिक्षण पद्धति</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="font-weight: bold;">दिवस 1: प्रथम</td><td>09:30 AM - 10:30 AM</td><td>प्रतिभागियों का पंजीयन, आईडी कार्ड वितरण, विज्ञान किट व स्टेशनरी वितरण।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 1: द्वितीय</td><td>10:30 AM - 11:30 AM</td><td>उद्घाटन समारोह: दीप प्रज्वलन, अतिथियों एवं रिसोर्स पर्सन्स का प्रेरणादायक उद्बोधन।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 1: तृतीय</td><td>11:30 AM - 01:00 PM</td><td>रोचक विज्ञान प्रदर्शन (Fun with Science): सरल प्रयोगों से विज्ञान के चमत्कारों की व्याख्या।</td></tr>
                    <tr><td style="font-weight: bold; background: #e2e8f0;">मध्याह्न</td><td>01:00 PM - 02:00 PM</td><td>पौष्टिक अल्पाहार एवं भोजन अवकाश (सभी प्रतिभागियों व मेंटर्स हेतु)।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 1: चतुर्थ</td><td>02:00 PM - 04:00 PM</td><td>विज्ञान प्रश्नमंच (Science Quiz): कक्षा 6वीं से 12वीं हेतु लिखित व बज़र राउंड्स।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 1: समापन</td><td>04:00 PM - 04:30 PM</td><td>प्रथम दिवस समीक्षा, क्विज परिणाम घोषणा एवं मॉडल विषयों का आवंटन।</td></tr>

                    <tr><td style="font-weight: bold;">दिवस 2: प्रथम</td><td>09:30 AM - 10:30 AM</td><td>हैंड्स-ऑन थ्योरी क्लास: प्रकाश, लेंस, दर्पण, विद्युत धारा व चुंबकत्व की समझ।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 2: द्वितीय</td><td>10:30 AM - 01:00 PM</td><td>मॉडल निर्माण कार्यशाला: बच्चे स्वयं अपने हाथों से बल्ब, मोटर, तार जोड़कर मॉडल बनाएंगे।</td></tr>
                    <tr><td style="font-weight: bold; background: #e2e8f0;">मध्याह्न</td><td>01:00 PM - 02:00 PM</td><td>अल्पाहार एवं भोजन अवकाश।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 2: तृतीय</td><td>02:00 PM - 03:30 PM</td><td>पर्यावरण व ऊर्जा मॉडल: सौर ऊर्जा, वर्षा जल संचयन, कचरा प्रबंधन पर वर्किंग प्रोजेक्ट्स।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 2: चतुर्थ</td><td>03:30 PM - 04:30 PM</td><td>प्रोजेक्टर शो: अंतरिक्ष विज्ञान, इसरो अभियान एवं आधुनिक खोजों पर सत्र।</td></tr>

                    <tr><td style="font-weight: bold;">दिवस 3: प्रथम</td><td>09:30 AM - 12:30 PM</td><td>भव्य विज्ञान प्रदर्शनी: बच्चों द्वारा निर्मित मॉडल्स की सार्वजनिक प्रदर्शनी व व्याख्या।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 3: द्वितीय</td><td>12:30 PM - 01:30 PM</td><td>निर्णायक मंडल द्वारा मॉडल्स एवं प्रस्तुतीकरण का निष्पक्ष मूल्यांकन।</td></tr>
                    <tr><td style="font-weight: bold; background: #e2e8f0;">मध्याह्न</td><td>01:30 PM - 02:30 PM</td><td>अल्पाहार एवं भोजन अवकाश।</td></tr>
                    <tr><td style="font-weight: bold;">दिवस 3: तृतीय</td><td>02:30 PM - 04:30 PM</td><td>समापन एवं सम्मान समारोह: मुख्य अतिथियों द्वारा विजेताओं को शील्ड व पुरस्कार, सभी को प्रमाण-पत्र।</td></tr>
                </tbody>
            </table>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 9 / 15</span>
        </div>
    </div>

    <!-- PAGE 10: KITS SPECIFICATIONS -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">प्रयोगात्मक विज्ञान किट्स एवं मॉडल विनिर्देश</div>
                <div class="page-subtitle">EXPERIMENTAL SCIENCE KITS & APPARATUS SPECIFICATIONS</div>
            </div>

            <p style="font-size: 13.5px; margin-bottom: 12px;">
                कार्यक्रम के दौरान प्रत्येक प्रतिभागी समूह को उच्च गुणवत्ता वाली हैंड्स-ऑन प्रयोगात्मक किट्स उपलब्ध कराई जाएंगी। इन किट्स का उद्देश्य विद्यार्थियों को बिना किसी खतरे के पूर्ण सुरक्षा के साथ विज्ञान के प्रयोग करने का अवसर देना है:
            </p>

            <table>
                <thead>
                    <tr>
                        <th style="width: 20%;">प्रयोग संवर्ग</th>
                        <th style="width: 32%;">प्रदान की जाने वाली सामग्री / किट</th>
                        <th style="width: 25%;">वैज्ञानिक सिद्धांत</th>
                        <th>अधिगम परिणाम (Outcome)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight: bold;">प्रकाश एवं प्रकाशिकी<br>(Optics)</td>
                        <td>समतल दर्पण, अवतल व उत्तल दर्पण, कांच का प्रिज्म, आवर्धक लेंस, एलईडी टॉर्च, प्रोटेक्टर शीट्स।</td>
                        <td>प्रकाश का परावर्तन, अपवर्तन, तथा सात रंगों में वर्ण विक्षेपण।</td>
                        <td>दर्पणों में बनने वाले प्रतिबिम्बों और प्रिज्म से इंद्रधनुष बनने की सटीक समझ।</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">विद्युत एवं परिपथ<br>(Electricity)</td>
                        <td>9V बैटरियां, सेल क्लिप्स, टॉगल स्विच, छोटे एलईडी बल्ब, कनेक्टिंग वायर्स, डीसी मोटर्स।</td>
                        <td>विद्युत परिपथ, सुचालक-कुचालक, ओपन व क्लोज सर्किट, विद्युत धारा।</td>
                        <td>परिपथ जोड़ना, स्विच कंट्रोल, विद्युत ऊर्जा का यांत्रिक ऊर्जा में रूपांतरण।</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">चुंबकत्व एवं गति<br>(Magnetism)</td>
                        <td>बार मैग्नेट्स, रिंग मैग्नेट्स, लोहे का बुरादा, दिशा सूचक कंपास, कॉपर वायर कॉइल।</td>
                        <td>चुंबकीय क्षेत्र रेखाएं, आकर्षण-प्रतिकर्षण, विद्युत चुंबक।</td>
                        <td>चुंबकीय बल रेखाओं का प्रत्यक्ष अनुभव तथा विद्युत चुंबक बनाने की विधि।</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">हरित ऊर्जा व पर्यावरण<br>(Renewable)</td>
                        <td>मिनी सोलर पैनल (5V), छोटे पंखे, वाटर लेवल इंडिकेटर किट, क्ले, कार्डबोर्ड, थर्माकोल।</td>
                        <td>सौर ऊर्जा का रूपांतरण, वर्षा जल संचयन, जल संरक्षण तकनीक।</td>
                        <td>नवीकरणीय ऊर्जा का महत्व और घरेलू स्तर पर सौर व जल संचयन की प्रेरणा।</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">ध्वनि एवं तरंगें<br>(Acoustics)</td>
                        <td>ट्यूनिंग फॉर्क्स, पेपर कप्स, रेजोनेंस स्ट्रिंग्स, रबर बैंड्स, प्लास्टिक पाइप्स।</td>
                        <td>ध्वनि की उत्पत्ति, कंपन (Vibration), आवृत्ति एवं ध्वनि तरंगें।</td>
                        <td>कंपन द्वारा ध्वनि निर्माण और ध्वनि संचरण के माध्यमों का प्रायोगिक ज्ञान।</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 10 / 15</span>
        </div>
    </div>

    <!-- PAGE 11: BUDGET BREAKDOWN -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">प्रस्तावित कार्यक्रम का मदवार अनुमानित बजट</div>
                <div class="page-subtitle">QUESTION 10: REALISTIC ITEMISED BUDGET BREAKDOWN (शुद्ध शैक्षणिक व्यय)</div>
            </div>

            <p style="font-size: 13.5px; margin-bottom: 12px;">
                प्रस्तुत बजट पूर्णतः यथार्थवादी, पारदर्शी एवं प्रत्यक्षतः छात्र कल्याण और प्रयोगात्मक विज्ञान शिक्षण पर आधारित है। इसमें किसी भी प्रकार का अनावश्यक व्यय नहीं रखा गया है, ताकि परिषद के अनुदान का पाई-पाई सदुपयोग हो सके:
            </p>

            <table>
                <thead>
                    <tr>
                        <th style="width: 6%; text-align: center;">क्र.</th>
                        <th style="width: 38%;">मद (Head of Expenditure)</th>
                        <th style="width: 20%; text-align: right;">प्रस्तावित राशि (₹)</th>
                        <th>औचित्य एवं व्यय का पूर्ण विवरण</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align: center;">1</td>
                        <td><strong>साइंस मॉडल किट्स, उपकरण व प्रयोगात्मक सामग्री</strong></td>
                        <td style="text-align: right; font-weight: bold;">₹ 65,000/-</td>
                        <td>200+ विद्यार्थियों हेतु हैंड्स-ऑन कंपोनेंट्स, मोटर्स, बैटरियां, लेंसेज, प्रिज्म, सोलर सेल व डिस्प्ले सामग्री।</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">2</td>
                        <td><strong>कार्यक्रम आयोजक, रिसोर्स पर्सन व प्रशिक्षक मानदेय</strong></td>
                        <td style="text-align: right; font-weight: bold;">₹ 50,000/-</td>
                        <td>3 दिवसीय तकनीकी विशेषज्ञों, विषय प्रवक्ताओं व सहायकों का मानदेय (4 रिसोर्स पर्सन x 3 दिन)।</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">3</td>
                        <td><strong>स्टेशनरी, बैकड्रॉप बैनर्स, फोल्डर्स व प्रमाण-पत्र</strong></td>
                        <td style="text-align: right; font-weight: bold;">₹ 30,000/-</td>
                        <td>मंच बैनर्स, फ्लैक्स होर्डिंग्स, सहभागिता प्रमाण पत्र, छात्र फोल्डर्स, पेन, नोटपैड्स, चार्ट्स व कार्यपत्रक।</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">4</td>
                        <td><strong>विज्ञान प्रश्नमंच (क्विज) एवं प्रतियोगिता सामग्री</strong></td>
                        <td style="text-align: right; font-weight: bold;">₹ 18,000/-</td>
                        <td>क्विज बज़र सिस्टम, क्वेश्चन बैंक कंपाइलेशन, डिस्प्ले बोर्ड्स, स्कोर शीट्स एवं स्टेज प्रॉप्स।</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">5</td>
                        <td><strong>छात्र-छात्राओं, शिक्षकों व अतिथियों हेतु जलपान/अल्पाहार</strong></td>
                        <td style="text-align: right; font-weight: bold;">₹ 38,000/-</td>
                        <td>3 दिन तक प्रतिदिन 200+ छात्र-छात्राओं, शिक्षकों व अतिथियों हेतु पौष्टिक स्वल्पाहार, भोजन, चाय व शुद्ध पेयजल।</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">6</td>
                        <td><strong>विजेताओं हेतु पुरस्कार, ट्रॉफी व स्मृति चिन्ह</strong></td>
                        <td style="text-align: right; font-weight: bold;">₹ 20,000/-</td>
                        <td>क्विज व मॉडल प्रतियोगिता के विजेताओं हेतु ज्ञानवर्धक विज्ञान किट्स, मेडल, शील्ड व मोमेंटो।</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">7</td>
                        <td><strong>स्थानीय लॉजिस्टिक्स, ध्वनि व्यवस्था व स्थल सज्जा</strong></td>
                        <td style="text-align: right; font-weight: bold;">₹ 14,000/-</td>
                        <td>प्रोजेक्टर व साउंड सिस्टम सेटअप, टेबल्स/चेयर्स व्यवस्था, स्थानीय परिवहन एवं स्थल प्रबंधन।</td>
                    </tr>
                    <tr class="table-total">
                        <td colspan="2" style="text-align: right; font-size: 14px;">कुल प्रस्तावित बजट (TOTAL PROPOSED BUDGET):</td>
                        <td style="text-align: right; font-size: 15px; color: var(--primary);">₹ 2,35,000/-</td>
                        <td style="font-weight: bold;">(दो लाख पैंतीस हजार रुपये मात्र)</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 10px; font-size: 12.5px; color: var(--text-muted); font-style: italic;">
                * नोट: उपरोक्त बजट में किसी भी प्रकार का मीडिया/वीडियो या अतिरिक्त प्रशासनिक अधिभार शामिल नहीं किया गया है। संपूर्ण राशि प्रत्यक्ष रूप से छात्र कार्यशाला एवं प्रयोगात्मक किट्स पर समर्पित है।
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 11 / 15</span>
        </div>
    </div>

    <!-- PAGE 12: 3-YEAR WORK REPORT -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">संस्था का विगत 3 वर्षों का कार्य प्रतिवेदन</div>
                <div class="page-subtitle">QUESTION 5: 3-YEAR PROGRESS & SOCIAL WELFARE WORK REPORT (संलग्न)</div>
            </div>

            <div class="a-text" style="font-size: 13.5px; line-height: 1.6;">राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर विगत 13 वर्षों से समाज के कमजोर एवं विस्थापित वर्गों के कल्याण हेतु निरंतर कार्यरत है। संस्था के विगत 3 वर्षों के प्रमुख कार्य एवं उपलब्धियां संक्षेप में निम्नानुसार हैं:

<strong>1. वित्तीय वर्ष 2022-23 की प्रमुख उपलब्धियां (सीए-ऑडिटेड प्रतिवेदन अनुसार):</strong>
• <strong>महिला सशक्तिकरण एवं निःशुल्क सिलाई केंद्र:</strong> ग्रामीण एवं विस्थापित क्षेत्र की 300+ महिलाओं हेतु निःशुल्क सिलाई केंद्र का संचालन किया गया, जिसमें प्रशिक्षण व्यय ₹ 41,255/- तथा ₹ 18,950/- की लागत से नई सिलाई मशीनें स्थापित की गईं।
• <strong>स्वास्थ्य शिविर एवं निःशुल्क औषधि वितरण:</strong> ग्रामीण क्षेत्रों में प्राथमिक स्वास्थ्य शिविरों का आयोजन कर ₹ 25,650/- की निःशुल्क दवाएं एवं स्वास्थ्य परामर्श जरूरतमंदों को उपलब्ध कराया गया।
• <strong>शीतकालीन कंबल वितरण एवं निर्धन सहायता:</strong> झुग्गी-बस्तियों एवं विस्थापित परिवारों में ₹ 24,500/- के गर्म कंबल तथा ₹ 12,500/- की सीधी आर्थिक/खाद्य सहायता प्रदान की गई।
• <strong>लाड़ली बहना योजना एवं शासकीय योजनाओं का प्रचार-प्रसार:</strong> शासन की जनकल्याणकारी योजनाओं की जागरूकता हेतु ₹ 19,650/- का सघन अभियान संचालित किया गया।
• <strong>पर्यावरण, पौधारोपण एवं ग्राम स्वच्छता:</strong> ग्रामीण अंचलों में स्वच्छता अभियान (व्यय ₹ 8,668/-) तथा पर्यावरण संरक्षण व वृक्षारोपण (व्यय ₹ 6,735/-) संपन्न कराया गया।
• <strong>नशामुक्ति अभियान:</strong> 'घर-घर नशा एवं व्यसन मुक्ति' कार्यक्रम के तहत ₹ 4,125/- के प्रचार-प्रसार से युवाओं को नशामुक्त जीवन हेतु प्रेरित किया गया।
• <strong>वित्तीय अनुशासन:</strong> वर्ष 2022-23 में कुल आय ₹ 2,70,859/- के विरुद्ध पारदर्शी व्यय करते हुए ₹ 25,862/- की शुद्ध बचत अर्जित की गई।

<strong>2. वित्तीय वर्ष 2021-22 की प्रमुख गतिविधियां:</strong>
• <strong>कोविड-19 उत्तर राहत कार्य:</strong> विस्थापित एवं श्रमिक परिवारों को राशन किट्स, मास्क एवं सैनिटाइजर का सघन वितरण।
• <strong>वैदिक शिक्षा एवं बाल संस्कार केंद्र:</strong> ग्रामीण बच्चों हेतु बुनियादी अक्षर ज्ञान, गणित व नैतिक शिक्षा की नियमित पाठशालाएं।

<strong>3. वित्तीय वर्ष 2020-21 की प्रमुख गतिविधियां:</strong>
• <strong>कोविड-19 आपातकालीन सहायता:</strong> लॉकडाउन के दौरान फंसे प्रवासी मजदूरों व असहाय नागरिकों हेतु भोजन पैकेट वितरण।
• <strong>सामुदायिक स्वास्थ्य एवं योग जागरूकता:</strong> ग्रामीण बस्तियों में रोग प्रतिरोधक क्षमता बढ़ाने हेतु योग एवं काढ़ा वितरण शिविर।</div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 12 / 15</span>
        </div>
    </div>

    <!-- PAGE 13: EXECUTIVE COMMITTEE -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">संस्था की प्रबंध कार्यकारिणी समिति (धारा 27)</div>
                <div class="page-subtitle">QUESTION 6: EXECUTIVE COMMITTEE OF NGO UNDER SECTION 27 (संलग्न)</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 6%;">क्र.</th>
                        <th style="width: 25%;">पदाधिकारी का नाम</th>
                        <th style="width: 18%;">पद (Designation)</th>
                        <th style="width: 18%;">व्यवसाय / योग्यता</th>
                        <th>पता एवं मोबाइल</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td><strong>श्री सुशील कुमार जसेले</strong></td><td>अध्यक्ष (Chairman)</td><td>समाजसेवा / स्नातक</td><td>वार्ड 66 कजरवारा नई बस्ती, जबलपुर<br>मो. 8770375392</td></tr>
                    <tr><td>2</td><td><strong>श्रीमती रंजीता जी</strong></td><td>उपाध्यक्ष (Vice President)</td><td>समाजसेवा / परास्नातक</td><td>शिवपुरी न्यू बस्ती, जबलपुर<br>मो. 8770375392</td></tr>
                    <tr><td>3</td><td><strong>श्री विवेक कुमार सोनी</strong></td><td>सचिव (Secretary)</td><td>व्यवसाय / स्नातक</td><td>कजरवारा, जबलपुर (म.प्र.)<br>मो. 9187703753</td></tr>
                    <tr><td>4</td><td><strong>श्री आनंद पटेल</strong></td><td>कोषाध्यक्ष (Treasurer)</td><td>वाणिज्य स्नातक / वित्त</td><td>मंडला रोड, जबलपुर (म.प्र.)</td></tr>
                    <tr><td>5</td><td><strong>श्रीमती आशा देवी</strong></td><td>कार्यकारिणी सदस्य</td><td>समाजसेवा</td><td>जबलपुर (म.प्र.)</td></tr>
                    <tr><td>6</td><td><strong>श्री राजेश कुमार</strong></td><td>कार्यकारिणी सदस्य</td><td>शिक्षाविद / शिक्षक</td><td>जबलपुर (म.प्र.)</td></tr>
                    <tr><td>7</td><td><strong>श्री मनोज कुमार</strong></td><td>कार्यकारिणी सदस्य</td><td>व्यवसाय / तकनीकी</td><td>जबलपुर (म.प्र.)</td></tr>
                </tbody>
            </table>

            <div style="margin-top: 18px; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid var(--primary);">
                <strong>प्रमाणीकरण:</strong> प्रमाणित किया जाता है कि उपरोक्त प्रबंध कार्यकारिणी समिति वर्तमान में विधिवत निर्वाचित एवं सहायक पंजीयक फर्म्स एवं संस्थाएं, जबलपुर संभाग द्वारा धारा 27 के अंतर्गत सत्यापित व स्वीकृत है।
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 13 / 15</span>
        </div>
    </div>

    <!-- PAGE 14: MANDATORY DOCUMENTS CHECKLIST -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">नियम, शर्तें एवं आवश्यक संलग्न दस्तावेजों की चेकलिस्ट</div>
                <div class="page-subtitle">TERMS & CONDITIONS & MANDATORY COMPLIANCE CHECKLIST</div>
            </div>

            <p style="font-size: 13.5px; margin-bottom: 12px;">
                मध्यप्रदेश विज्ञान एवं प्रौद्योगिकी परिषद (MPCST) द्वारा निर्धारित नियम एवं शर्तों के अनुसार यह प्रस्ताव 09 प्रतियों में प्रस्तुत किया जा रहा है। प्रस्ताव के साथ निम्नलिखित सभी आवश्यक अभिलेख विधिवत संलग्न किए गए हैं:
            </p>

            <table>
                <thead>
                    <tr>
                        <th style="width: 8%; text-align: center;">क्र.</th>
                        <th>संलग्नक का नाम (Document Description)</th>
                        <th style="width: 25%; text-align: center;">स्थिति (Status)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="text-align: center;">1</td><td>व्याख्या पत्र एवं परियोजना प्रस्ताव (मूल प्रपत्र 09 प्रतियों में)</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">2</td><td>विस्तृत मदवार बजट विवरणी (Head-wise Itemized Budget)</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">3</td><td>संस्था पंजीयन प्रमाण-पत्र (क्रमांक 04/14/07/15659/13) की सत्यापित प्रति</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">4</td><td>संस्था के उपनियम / बायलॉज (Bylaws) की प्रमाणित प्रति</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">5</td><td>संस्था का विगत 3 वर्षों का प्रगति प्रतिवेदन (Annual Progress Reports)</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">6</td><td>संस्था की विगत 3 वर्षों की सीए ऑडिटेड बैलेंस शीट एवं आय-व्यय लेखा</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">7</td><td>वर्तमान प्रबंध कार्यकारिणी पदाधिकारियों की धारा 27 अंतर्गत सत्यापित सूची</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">8</td><td>संस्था के बैंक खाते का विवरण (HDFC Bank) एवं निरस्त चेक (Cancelled Cheque)</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">9</td><td>नीति आयोग दर्पण पोर्टल (NGO Darpan ID: MP/2023/0342298) रजिस्ट्रेशन प्रति</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">10</td><td>संस्था के अध्यक्ष एवं सचिव के आधार कार्ड की छायाप्रति</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">11</td><td>परिषद के नियम एवं शर्तों के अनुपालन संबंधी घोषणा-पत्र</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                    <tr><td style="text-align: center;">12</td><td>गैर-काली सूची में होने का शपथ-पत्र एवं आरटीआई (RTI) घोषणा-पत्र</td><td style="text-align: center; color: green; font-weight: bold;">[ √ ] संलग्न (Attached)</td></tr>
                </tbody>
            </table>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 14 / 15</span>
        </div>
    </div>

    <!-- PAGE 15: LEGAL DECLARATIONS & RTI -->
    <div class="page-sheet">
        <div>
            <div class="page-header-box">
                <div class="page-title">वैधानिक घोषणा-पत्र एवं आरटीआई (RTI) प्रपत्र</div>
                <div class="page-subtitle">MANDATORY DECLARATIONS & RTI AFFIDAVIT</div>
            </div>

            <div class="qa-block">
                <div class="q-text">घोषणा-पत्र क्रमांक 1 (शर्तों की सहमति):</div>
                <div class="a-text">प्रमाणित किया जाता है कि मध्यप्रदेश विज्ञान एवं प्रौद्योगिकी परिषद (MPCST), भोपाल के कार्यक्रम / परियोजना प्रस्ताव हेतु दी गई समस्त नियम एवं शर्तों के अनुपालन हेतु हमारी संस्था 'राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर' पूर्णतः सहमत एवं वचनबद्ध है।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">घोषणा-पत्र क्रमांक 2 (गैर-काली सूची प्रमाणन):</div>
                <div class="a-text">प्रमाणित किया जाता है कि संस्था 'राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर' को राज्य शासन, केन्द्र शासन अथवा किसी भी शासकीय विभाग/निकाय द्वारा कभी भी किसी भी स्तर पर काली सूची (Blacklist) में नहीं रखा गया है और न ही संस्था के विरुद्ध कोई प्रतिकूल कार्यवाही प्रचलित है।</div>
            </div>

            <div class="qa-block">
                <div class="q-text">आरटीआई घोषणा-पत्र क्रमांक 3 (सूचना का अधिकार अधिनियम, 2005 का पालन):</div>
                <div class="a-text">राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर (पंजीयन क्रमांक 04/14/07/15659/13 दिनांक 02.09.2013) द्वारा सूचना का अधिकार अधिनियम, 2005 का निष्ठापूर्वक पालन किया जा रहा है। संस्था में लोक सूचना अधिकारी एवं प्रथम अपीलीय अधिकारी नियुक्त किए गए हैं, जिनका विवरण निम्नानुसार है:
1. <strong>लोक सूचना अधिकारी:</strong> श्री विवेक कुमार सोनी (सचिव), मो. 8770375392, पता: कजरवारा नई बस्ती, जबलपुर (म.प्र.)
2. <strong>प्रथम अपीलीय अधिकारी:</strong> श्री सुशील कुमार जसेले (अध्यक्ष), मो. 8770375392, पता: वार्ड 66 कजरवारा नई बस्ती, जबलपुर (म.प्र.)</div>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 13px;">
                <div style="width: 250px;">
                    <div style="border-bottom: 1px solid #475569; height: 40px;"></div>
                    <div style="margin-top: 6px; font-weight: bold;">हस्ताक्षर कार्यक्रम समन्वयक</div>
                    <div>(नाम: श्री सुशील कुमार जसेले)</div>
                    <div>अध्यक्ष, राष्ट्र भक्ति संस्थान</div>
                    <div>दिनांक: ........................</div>
                </div>

                <div style="width: 280px;">
                    <div style="border-bottom: 1px solid #475569; height: 40px;"></div>
                    <div style="margin-top: 6px; font-weight: bold;">हस्ताक्षर एवं अधिकृत सील</div>
                    <div>(अध्यक्ष / सचिव)</div>
                    <div>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान</div>
                    <div>जबलपुर (मध्यप्रदेश)</div>
                </div>
            </div>
        </div>
        <div class="page-footer">
            <span>राष्ट्र भक्ति विस्थापित जन कल्याण शिक्षा संस्थान, जबलपुर</span>
            <span>पृष्ठ 15 / 15 (अंतिम पृष्ठ)</span>
        </div>
    </div>

</body>
</html>
"""

with open(r"D:\GARUDA-AI\docs\MPCST_Rashtrabhakti_15_Page_Project_Report.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("SUCCESS: Generated 15-page HTML report at: D:\\GARUDA-AI\\docs\\MPCST_Rashtrabhakti_15_Page_Project_Report.html")
