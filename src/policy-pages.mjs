export const publicContactEmail = 'pym123amingge@gmail.com';
const link = (en, zh, href) => ({label:[en,zh],href});
const section = (en, zh, paragraphs, links=[]) => ({heading:[en,zh],paragraphs,links});
const contact = link('Email TensorDrill','联系 TensorDrill','mailto:'+publicContactEmail);
const privacy = link('Privacy policy','隐私政策','/privacy/');
const cookies = link('Cookie and storage choices','Cookie 与存储选择','/cookies/');
const googleData = link('How Google uses data on partner sites','Google 如何使用合作网站的数据','https://policies.google.com/technologies/partner-sites');
const googleAds = link('Google advertising settings','Google 广告设置','https://myadcenter.google.com/');
const adChoices = link('Third-party advertising choices','第三方广告选择','https://optout.aboutads.info/');

export const policyPages = [
 {
  path:'/privacy/', title:['Privacy Policy','隐私政策'],
  description:['How TensorDrill handles local practice data, hosting requests, advertising cookies, privacy choices and enquiries.','了解 TensorDrill 如何处理本地练习记录、托管请求、广告 Cookie、隐私选择及相关咨询。'],
  heading:['Privacy Policy','隐私政策'],
  intro:['This policy covers tensordrill.com and its English and Chinese pages. For privacy enquiries, contact '+publicContactEmail+'.','本政策适用于 tensordrill.com 及其中英文页面。隐私相关咨询请联系 '+publicContactEmail+'。'],
  sections:[
   section('What is active today','目前启用的功能',[
    ['The application has no account registration, cloud progress database or analytics tags. The production site includes the Google AdSense script. Loading that script sends a request to Google, which can include your IP address, browser information and page URL. Whether ads appear depends on Google approval, account settings and applicable privacy choices.','应用没有账号注册、云端进度数据库或分析追踪标签。正式站已接入 Google AdSense 脚本。加载脚本会向 Google 发出请求，可能包含你的 IP 地址、浏览器信息及页面网址。广告是否展示取决于 Google 审核、账号设置及适用的隐私选择。']
   ]),
   section('Code, drafts and practice history','代码、草稿与练习记录',[
    ['Your code runs in your browser through a Pyodide Worker. The application does not send your editor contents, tests, solved marks or practice history to our server or a model API. Code you choose to run can itself make network requests; avoid running untrusted code or including secrets.','代码通过 Pyodide Worker 在浏览器运行。应用不会将编辑器内容、测试、完成标记或练习历史发送到我们的服务器或模型 API。你主动运行的代码本身可能发起网络请求，请勿运行不可信代码或填写秘密信息。'],
    ['Drafts, completed exercises, daily goals and practice days are stored in this browser using localStorage. The English and Chinese pages on the same domain share these records. Other browsers, devices and domains have separate records. Data remains until you clear it, the browser removes it or you use private browsing.','草稿、已完成题目、每日目标和练习日期通过 localStorage 保存在当前浏览器。同一域名的中英文页面共享记录；其他浏览器、设备和域名分别保存。记录保留至你清除数据、浏览器移除数据，或隐私浏览会话结束。'],
    ['You can download or import a JSON backup on the Progress page. Backups contain your code and are processed locally. Clearing site data removes local progress, so download a backup first if you want to keep it. We cannot recover deleted local records.','你可以在练习进度页下载或导入 JSON 备份。备份含有代码，由浏览器本地处理。清除网站数据会移除本地进度，如需保留请先下载备份。我们无法恢复已删除的本地记录。']
   ],[link('Progress and backups','练习进度与备份','/progress/')]),
   section('Hosting, security and the Python download','托管、安全与 Python 下载',[
    ['Cloudflare delivers and protects the production site. jsDelivr delivers the Python runtime when you run code. These providers receive normal request information, which can include IP address, requested URL, browser information, referrer and timing, to deliver their services and handle security or abuse.','Cloudflare 负责正式站的访问与安全防护，jsDelivr 在运行代码时提供 Python 运行时。这些提供方会收到常规请求信息，可能包括 IP 地址、请求网址、浏览器信息、来源页面及时间，用于交付服务和处理安全或滥用问题。'],
    ['Hosting and security providers may use cookies or browser checks for protection. Their processing locations and retention periods depend on their own policies. We do not control their infrastructure or promise a particular log-retention period.','托管与安全提供方可能使用 Cookie 或浏览器验证进行防护。其数据处理地点及保留时间取决于各自政策。我们不控制其基础设施，也不承诺特定的日志保留期限。']
   ],[link('Cloudflare privacy policy','Cloudflare 隐私政策','https://www.cloudflare.com/privacypolicy/'),link('jsDelivr privacy policy','jsDelivr 隐私政策','https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net')]),
   section('Google AdSense and other advertising providers','Google AdSense 与其他广告提供方',[
    ['If Google AdSense is activated, Google and participating advertising companies may store and read advertising cookies and similar identifiers. Browsing activity from this site or other sites can be used to choose personalized ads. Google advertising cookies allow Google and its partners to relate those visits to advertising shown to you.','未来启用 Google AdSense 后，Google 及参与投放的广告公司可能存储并读取广告 Cookie 和类似标识符。本网站或其他网站的浏览活动可能被用于选择个性化广告。Google 广告 Cookie 可帮助 Google 及其合作方将这些访问与向你展示的广告关联。'],
    ['Ad delivery may also involve web beacons, IP addresses, device or browser information and interactions with ads for delivery, measurement and fraud prevention. Where other ad vendors participate, their identities, purposes and privacy information will be available through the advertising consent interface before relevant processing is enabled.','广告投放还可能涉及网络信标、IP 地址、设备或浏览器信息及广告交互数据，用于交付、衡量效果和防范作弊。如有其他广告供应商参与，将在启用相关处理前，通过广告同意界面提供其身份、用途及隐私信息。'],
    ['You can adjust personalized advertising in Google advertising settings, or use participating vendors’ controls and the third-party choices page linked below. Turning off personalization does not necessarily remove all ads or all storage used for ad security.','你可以在 Google 广告设置中调整个性化广告，或使用参与供应商的控制选项及下方第三方选择页面。关闭个性化不一定会移除全部广告或广告安全用途的全部存储。']
   ],[googleData,googleAds,adChoices]),
   section('Consent and regional privacy choices','同意管理与地区隐私选择',[
    ['Before advertising is enabled where consent is required, an appropriate consent flow must be in place. For personalized Google ads in the EEA, the UK and Switzerland, we will use a Google-certified consent management platform integrated with the IAB Transparency and Consent Framework. A policy page or a general notice is not a substitute for that consent flow.','在依法需要同意的地区启用广告前，需要具备适用的同意流程。向欧洲经济区、英国和瑞士用户投放 Google 个性化广告时，我们将使用通过 Google 认证并集成 IAB 透明度与同意框架的同意管理平台。政策页面或一般提示不能替代该同意流程。'],
    ['Where an advertising consent message is displayed, use its controls to review or change your choices. Applicable US-state sale, sharing or targeted-advertising choices and supported browser opt-out signals must be handled by the advertising integration. This policy page does not collect or record advertising consent.','如页面显示广告同意消息，请通过其中的控件查看或修改选择。适用的美国州个人信息出售、共享或定向广告选择，以及受支持的浏览器退出信号，必须由广告集成处理。本政策页不收集或记录广告同意。']
   ],[cookies]),
   section('Enquiries, rights and children','咨询、权利与未成年人',[
    ['If you email us, we receive the address and information you choose to include and use them to address your request. Please send only what is necessary. Avoid passwords, identity documents, confidential research code and other sensitive material. Correspondence is kept only as needed for the request and applicable obligations.','如果你发送邮件，我们会收到邮箱地址及你主动提供的信息，并用于处理请求。请仅提供必要信息，不要发送密码、身份证件、保密研究代码或其他敏感材料。通信内容仅在处理请求及履行适用义务所需的范围内保留。'],
    ['Depending on your location, you may have rights concerning access, correction, deletion, objection or withdrawal of consent. Contact the maintainer for information that we actually hold. Local practice records can be exported or deleted on your device; we have no remote copy to retrieve or erase.','根据你的所在地，你可能享有访问、更正、删除、反对处理或撤回同意等权利。对于我们实际持有的信息，请联系维护者。本地练习记录可以在你的设备上导出或删除，我们没有可远程调取或清除的副本。'],
    ['TensorDrill is intended for university students, researchers and other advanced learners, and is not directed at children under 13. Please contact us if you believe a child has sent personal information to the maintainer.','TensorDrill 面向大学生、研究人员及其他进阶学习者，不以 13 岁以下儿童为服务对象。如你认为儿童向维护者发送了个人信息，请联系我们。'],
    ['Policy changes will appear on this page with an updated date. Advertising will require an updated notice and working privacy controls before activation.','政策调整会在本页发布并更新日期。启用广告前，需要更新相关说明并提供有效的隐私控制。']
   ],[contact])
  ]
 },
 {
  path:'/cookies/',title:['Cookies & Local Storage','Cookie 与本地存储'],
  description:['Understand TensorDrill browser storage, security cookies, possible advertising cookies and your available choices.','了解 TensorDrill 的浏览器存储、安全 Cookie、可能的广告 Cookie 以及可用选择。'],
  heading:['Cookies & Local Storage','Cookie 与本地存储'],
  intro:['This page explains the technologies used for practice progress and those that may be used by service providers or advertising.','本页说明练习进度使用的存储技术，以及服务提供方或广告可能使用的技术。'],
  sections:[
   section('Practice storage','练习记录存储',[
    ['The application uses localStorage for code drafts, solved marks, daily goals and practice history. It is stored on your device and has no automatic expiry set by TensorDrill. It is separate from advertising consent. Refusing advertising must not prevent access to the free exercises.','应用使用 localStorage 保存代码草稿、完成标记、每日目标与练习历史。数据保存在你的设备上，TensorDrill 不设置自动到期时间。它与广告同意相互独立，拒绝广告不得妨碍访问免费练习。'],
    ['Use your browser’s site-data settings to remove stored practice data. Download a Progress backup first if you want to preserve it. Disabling browser storage can prevent drafts and progress from persisting, although you can still read the exercises.','通过浏览器的网站数据设置可以删除练习数据，如需保留请先在练习进度页下载备份。禁用浏览器存储可能导致草稿和进度无法持久保存，但仍可阅读题目。']
   ],[link('Download a practice backup','下载练习备份','/progress/')]),
   section('Service-provider cookies','服务提供方的 Cookie',[
    ['Cloudflare and other delivery or security providers may use cookies or browser checks to serve the site and reduce abuse. Their policies explain their processing. Clearing or blocking those cookies can trigger additional security checks.','Cloudflare 等交付或安全提供方可能使用 Cookie 或浏览器验证，以提供网站服务并减少滥用。其政策说明具体处理方式。清除或阻止这些 Cookie 可能触发额外安全验证。']
   ],[link('Cloudflare privacy policy','Cloudflare 隐私政策','https://www.cloudflare.com/privacypolicy/')]),
   section('Advertising preferences','广告偏好',[
    ['The production site loads the Google AdSense script. Google and participating vendors may use advertising cookies or similar technologies when ads are served, subject to applicable settings and privacy choices. Use any displayed advertising consent message to review vendors, storage purposes and choices. This page does not record advertising consent or act as a consent platform.','正式站会加载 Google AdSense 脚本。在广告投放时，Google 和参与的供应商可能使用广告 Cookie 或类似技术，具体取决于适用设置和隐私选择。如页面显示广告同意消息，请通过其中的界面查看供应商、存储用途和选择。本页不记录广告同意，也不是同意管理平台。'],
    ['Where consent is required, eligible advertising storage and processing must follow your choice. A non-personalized ad is not automatically free of cookies or consent obligations. An active consent platform must also provide a way to revisit your decision.','在需要同意的地区，相关广告存储与处理必须遵循你的选择。非个性化广告并不自动免除 Cookie 或同意义务。启用同意管理平台后，还必须提供重新修改决定的入口。'],
    ['You can also use Google advertising settings or the controls offered by participating third-party vendors. Browser cookie controls may remove saved preferences as well as advertising identifiers.','你也可以使用 Google 广告设置或参与的第三方供应商提供的控制选项。浏览器 Cookie 控制可能同时移除已保存的偏好和广告标识符。']
   ],[googleAds,adChoices,privacy,contact])
  ]
 },
 {
  path:'/terms/',title:['Terms of Use','使用条款'],
  description:['Terms for using TensorDrill exercises, browser code execution, local progress, reference solutions and external services.','TensorDrill 练习、浏览器代码执行、本地进度、参考题解与外部服务的使用条款。'],
  heading:['Terms of Use','使用条款'],
  intro:['These terms describe the use of TensorDrill, a free AI coding-practice platform. Questions can be sent to '+publicContactEmail+'.','本条款适用于 TensorDrill 免费 AI 编程练习平台。相关问题请发送至 '+publicContactEmail+'。'],
  sections:[
   section('Educational purpose','教学用途',[
    ['Exercises and reference solutions support learning and research practice. They are not a professional qualification, a verified contest result or production-ready model software. Published tests check the stated exercise contract and do not prove that a larger system is correct or safe.','题目和参考实现用于学习及研究练习，不代表专业资格、经过认证的比赛成绩或可直接用于生产的模型软件。公开测试用于检查题目的约定，不能证明更大系统的正确性或安全性。']
   ]),
   section('Responsible use','合理使用',[
    ['Run only code you understand and have permission to use. Do not submit secrets, confidential code or other people’s personal information. Do not use the site to distribute malicious software, disrupt services, infringe rights or misrepresent local practice results as verified rankings.','仅运行你理解且有权使用的代码。不要填写秘密信息、保密代码或他人的个人资料。不得利用网站传播恶意软件、干扰服务、侵犯权利，或将本地练习结果冒充经过认证的排名。']
   ]),
   section('Your work and the published material','你的作品与网站内容',[
    ['You retain your rights in the code you write. Editing code locally does not transfer ownership to TensorDrill. You may use our original exercises and reference implementations for your personal learning; broader republication or commercial redistribution requires permission unless a separately stated license permits it.','你保留自己编写代码的相关权利。在本地编辑代码不会将所有权转交给 TensorDrill。你可以将本站原创练习与参考实现用于个人学习；如需更大范围转载或商业再分发，除非另有适用许可，否则应先取得许可。'],
    ['References, third-party software and external resources remain subject to their owners’ terms and licenses. TensorDrill is an independent project and is not endorsed by Google, LeetCode or the authors of cited papers.','参考资料、第三方软件和外部资源仍受各自所有者的条款与许可约束。TensorDrill 是独立项目，不代表获得 Google、LeetCode 或所引论文作者的背书。']
   ],[link('Editorial standards','内容标准','/standards/')]),
   section('Availability, accuracy and local records','可用性、准确性与本地记录',[
    ['The site is provided as available. We work to correct errors but do not promise uninterrupted access, compatibility with every browser or that every explanation is error-free. Verify results before relying on them in research or other work, and report reproducible problems.','网站按实际可用状态提供。我们会努力修正错误，但不承诺持续访问、兼容全部浏览器或所有解释完全无误。将结果用于研究或其他工作前，请自行验证，并反馈可复现的问题。'],
    ['You are responsible for keeping copies of work you want to preserve. Clearing browser data, changing domains or losing a device can separate or remove local progress. No exclusion in these terms is intended to remove rights or responsibilities that applicable law does not allow to be excluded.','请为需要保留的作品自行保存副本。清除浏览器数据、更换域名或设备丢失可能导致本地进度分离或移除。本条款不意图排除适用法律不允许排除的权利或责任。']
   ],[privacy]),
   section('Advertising, external links and updates','广告、外部链接与更新',[
    ['If ads or sponsorships are introduced, they will be identified separately from exercises and navigation. Advertiser claims and external destinations are not endorsements by TensorDrill. The advertising policy describes our placement and editorial standards.','未来引入广告或赞助时，会将其与练习及导航明确区分。广告主的主张和外部链接不代表 TensorDrill 的认可。广告政策说明相关展示与编辑原则。'],
    ['We may update these terms as the service changes and will publish the updated date here. For privacy, copyright, accessibility or other questions, contact the maintainer.','服务变化时，我们可能更新条款，并在本页注明更新日期。隐私、版权、无障碍访问或其他问题，请联系维护者。']
   ],[link('Advertising policy','广告政策','/advertising/'),contact])
  ]
 },
 {
  path:'/advertising/',title:['Advertising & Editorial Independence','广告与编辑独立性'],
  description:['TensorDrill advertising disclosures, editorial independence, safe ad placement and privacy choices.','TensorDrill 的广告披露、编辑独立性、广告展示位置与隐私选择。'],
  heading:['Advertising & Editorial Independence','广告与编辑独立性'],
  intro:['TensorDrill has integrated the Google AdSense script on its production site to help support a free practice library. Ad display depends on Google approval, account settings and applicable privacy choices. This release includes no paid editorial placements or affiliate links.','TensorDrill 已在正式站接入 Google AdSense 脚本，以支持免费的练习题库。广告展示取决于 Google 审核、账号设置及适用的隐私选择。本版本没有付费软文展示或联盟营销链接。'],
  sections:[
   section('Clear placement and labels','清晰的展示位置与标识',[
    ['If advertising is activated, ad areas will be clearly labelled Advertisement and kept distinct from question links, learning recommendations and controls. We will keep ads out of the code editor, test results and Run or Submit controls, and out of the personal progress dashboard.','未来启用广告时，广告区域会明确标注“广告”，并与题目链接、学习推荐及操作控件区分。广告不会放在代码编辑器、测试结果、运行或提交控件区域，也不会放在个人进度面板。'],
    ['Ads will not be required to unlock solutions or record progress. We will not reward ad clicks, ask learners to click ads to support the site, or make clicking an ad look like the next step in solving a problem.','阅读题解或记录进度不以观看广告为条件。我们不会奖励广告点击、要求学习者点击广告来支持网站，或将广告伪装成解题的下一步操作。']
   ]),
   section('Independent exercise content','独立的练习内容',[
    ['Advertising does not determine whether a solution is accepted, which tests are published or how an explanation is written. Any future sponsorship or affiliate relationship will be disclosed near the relevant content. References to a paper, tool or model alone do not indicate a paid relationship.','广告不会决定解答是否通过、发布哪些测试或如何编写题解。未来如有赞助或联盟营销关系，会在相关内容附近披露。仅引用论文、工具或模型并不代表存在付费关系。']
   ],[link('Editorial standards','内容标准','/standards/')]),
   section('Privacy and advertising choices','隐私与广告选择',[
    ['If AdSense is enabled, Google and participating ad vendors may process advertising identifiers and other request data as explained in our privacy policy. Required consent and regional opt-out controls must be operational before advertising is activated for the affected visitors.','未来启用 AdSense 时，Google 和参与的广告供应商可能按隐私政策所述处理广告标识符及其他请求数据。面向相关访问者启用广告前，必须先提供适用的同意及地区退出控制。']
   ],[privacy,cookies,googleData,googleAds]),
   section('Report an advertising concern','反馈广告相关问题',[
    ['If you encounter a misleading or inappropriate ad once advertising is active, email the maintainer with the page URL, approximate time and a description. Do not click an ad just to investigate it, and remove personal details from any screenshot.','未来启用广告后，如遇到误导性或不适当的广告，请将页面网址、大致时间及说明发送给维护者。不要为了调查而专门点击广告；如附截图，请移除个人资料。']
   ],[contact])
  ]
 },
 {
  path:'/about/',title:['About TensorDrill','关于 TensorDrill'],
  description:['About TensorDrill, an independent library of original AI coding exercises, tested Python solutions and bilingual learning resources.','了解 TensorDrill：提供原创 AI 编程练习、经测试的 Python 题解与中英文学习资源的独立项目。'],
  heading:['Learn AI by implementing it.','通过亲手实现学习 AI。'],
  intro:['TensorDrill is a free AI coding-practice platform. Build a deeper understanding of AI by implementing and testing its core ideas.','TensorDrill 是免费的 AI 编程练习平台，通过亲手实现与测试，帮助你理解 AI 的核心原理。'],
  sections:[
   section('Hands-on AI practice','动手练习 AI',[
    ['Practice foundations, Transformers, generative models, LLM systems, agents and world models with original Python exercises, repeatable tests and free explanations.','通过原创 Python 练习、可重复测试和免费题解，学习数学基础、Transformer、生成模型、LLM 系统、智能体和世界模型。'],
    ['Run Python in your browser without an account or model API key. Your practice progress stays on your device.','无需账号或模型 API 密钥，即可在浏览器运行 Python。练习进度保存在你的设备上。']
   ],[link('Browse AI coding challenges','浏览 AI 编程题库','/problems/'),link('Editorial standards','内容标准','/standards/')]),
   section('Ongoing updates','持续更新',[
    ['We maintain the exercises, check corrections against their tests and expand the library over time. Send us feedback to help improve TensorDrill.','我们持续维护题目、验证修正并逐步扩充题库。欢迎反馈问题和建议，帮助 TensorDrill 不断改进。']
   ],[contact])
  ]
 },
 {
  path:'/contact/',title:['Contact & Report a Problem','联系与问题反馈'],
  description:['Contact TensorDrill about exercise errors, privacy, copyright, accessibility or advertising concerns.','联系 TensorDrill，反馈题目错误、隐私、版权、无障碍访问或广告相关问题。'],
  heading:['Contact TensorDrill','联系 TensorDrill'],
  intro:['For exercise feedback, privacy, copyright, advertising and other enquiries, email '+publicContactEmail+'.','题目反馈、隐私、版权、广告及其他咨询，请发送邮件至 '+publicContactEmail+'。'],
  sections:[
   section('Email enquiries','邮件咨询',[
    ['The maintainer receives enquiries at the email address above. Include a clear subject and only the information needed to address your request. Do not send passwords, identity documents or confidential code.','维护者通过上述邮箱接收咨询。请填写清晰的主题，并仅提供处理请求所需的信息，不要发送密码、身份证件或保密代码。'],
    ['Reading and practicing on TensorDrill require no account. Only include the information needed to investigate your enquiry.','阅读与练习 TensorDrill 无需账号。咨询时请仅提供调查问题所需的信息。']
   ],[contact]),
   section('What helps us investigate','有助于排查的信息',[
    ['For a test or explanation error, include the exercise URL, a minimal input, the expected and actual result, and your browser. For a copyright concern, identify the material and your relationship to the rights holder, with enough information for us to review the claim.','反馈测试或题解错误时，请提供题目网址、最小输入、预期及实际结果和浏览器信息。反馈版权问题时，请指出相关材料及你与权利人的关系，并提供足够的信息供我们核查。'],
    ['We review reports as project maintenance time allows and do not promise a fixed response time. If you include a screenshot or backup, remove personal or confidential data first.','我们会根据项目维护时间安排核查反馈，不承诺固定回复时限。如附截图或备份，请先移除个人或保密数据。']
   ],[privacy])
  ]
 }
];

export const additionalPolicyPaths = policyPages.map(page=>page.path).filter(path=>!['/privacy/','/about/','/contact/'].includes(path));
const translations={
 'Site policies':'网站政策',
 'Last updated: October 10, 2026':'更新日期：2026 年 10 月 10 日',
 'Privacy policy':'隐私政策','Terms of use':'使用条款','Cookie choices':'Cookie 选择','Advertising policy':'广告政策'
};
const collect=value=>{
 if(Array.isArray(value)) {
  if(value.length===2 && value.every(item=>typeof item==='string'))translations[value[0]]=value[1];
  else value.forEach(collect);
 } else if(value && typeof value==='object')Object.values(value).forEach(collect);
};
policyPages.forEach(collect);
export const policyTranslations=translations;
