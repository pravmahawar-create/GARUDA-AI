const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const candidates = [
  // CHANDIGARH
  {
    id: "INST_CHD_TECEDO",
    name: "Techedo Technologies",
    city: "Chandigarh",
    domain: "techedo.com",
    email: "hr@techedo.com",
    backupEmail: "info@techedo.com",
    courseFocus: "Full-Stack Development, Python AI & Software Engineering",
    sector: "Computer Education & Industrial Training"
  },
  {
    id: "INST_CHD_CBITSS",
    name: "CBitss Technologies",
    city: "Chandigarh",
    domain: "cbitss.in",
    email: "cbitss.chd@gmail.com",
    backupEmail: "info@cbitss.in",
    courseFocus: "Advance Computer Courses, Data Science & Web Technologies",
    sector: "Computer Education & IT Academy"
  },
  {
    id: "INST_CHD_EXCELLENCE",
    name: "Excellence Technology",
    city: "Chandigarh",
    domain: "excellencetechnology.in",
    email: "info@excellencetechnology.in",
    backupEmail: "excellencetechnologychd@gmail.com",
    courseFocus: "Industrial IT Training, Python & Cloud Computing",
    sector: "Computer Training Institute"
  },
  {
    id: "INST_CHD_WEBTECH",
    name: "Webtech Learning",
    city: "Chandigarh",
    domain: "webtechlearning.com",
    email: "info@webtechlearning.com",
    courseFocus: "Web Designing, Software Testing & App Development",
    sector: "IT Training & Web Academy"
  },

  // JAIPUR
  {
    id: "INST_JAI_GRRAS",
    name: "Grras Solutions",
    city: "Jaipur",
    domain: "grras.com",
    email: "info@grras.com",
    courseFocus: "Cloud Computing, Python, Data Science & DevOps",
    sector: "Advanced Computer Training Center"
  },
  {
    id: "INST_JAI_DAAC",
    name: "DAAC (Delhi Academy of Advanced Computing)",
    city: "Jaipur",
    domain: "daac.in",
    email: "info@daac.in",
    courseFocus: "Programming, Web Development, MCA/BCA Project Training",
    sector: "Computer Education Institute"
  },
  {
    id: "INST_JAI_WSCUBE",
    name: "WsCube Tech",
    city: "Jaipur",
    domain: "wscubetech.com",
    email: "info@wscubetech.com",
    courseFocus: "Full-Stack Python, Cybersecurity, Mobile Development",
    sector: "Tech Upskilling & Computer Center"
  },

  // MUMBAI
  {
    id: "INST_MUM_QUICKXPERT",
    name: "QuickXpert Infotech",
    city: "Mumbai",
    domain: "quickxpertinfotech.com",
    email: "inquiry@quickxpertinfotech.com",
    backupEmail: "info@quickxpertinfotech.com",
    courseFocus: "Software Development, Python, Web Design & Database Admin",
    sector: "IT & Computer Training Institute"
  },
  {
    id: "INST_MUM_LAQSHYA",
    name: "Laqshya Institute of Skills Training",
    city: "Mumbai",
    domain: "laqshya.in",
    email: "info@laqshya.in",
    courseFocus: "IT Software, Web Development, Advanced Excel & Tally",
    sector: "Computer & Vocational Training Center"
  },
  {
    id: "INST_MUM_SEED",
    name: "SEED Infotech",
    city: "Mumbai",
    domain: "seedinfotech.com",
    email: "contact@seedinfotech.com",
    courseFocus: "Java, .NET, Software Testing & Cloud Technologies",
    sector: "Corporate IT & Computer Academy"
  }
];

function checkMx(domain) {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) resolve(null);
      else resolve(addresses);
    });
  });
}

async function run() {
  console.log("🔍 Verifying Computer Centers & IT Academies in Chandigarh, Jaipur, and Mumbai...\n");
  const verified = [];

  for (const c of candidates) {
    const mx = await checkMx(c.domain);
    if (mx) {
      console.log(`✔ [VERIFIED DOMAIN] ${c.name} (${c.city}) — ${c.domain} -> MX: ${mx[0].exchange}`);
      verified.push({ ...c, mxExchange: mx[0].exchange });
    } else {
      console.log(`✖ [FAILED MX] ${c.name} (${c.domain})`);
    }
  }

  console.log(`\nVerified ${verified.length} / ${candidates.length} candidate domains.`);
}

run().catch(console.error);
