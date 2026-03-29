// This is going to be used for keyword matching, rule evaluation, and will make the detections for using. 
// some of the logic here will be based on the parsed data that we get from the parser module. 
// We will be using the parsed data to run our detection algorithms and then we will be using the results of those algorithms to make our detections.  
// In this file it will be pure logic == easy to debug == easy to explain in the final paper 
const CLAUSE_PATTERNS = {
  tracking_cookies: [
    /\bcookies?\b/i,
    /\btracking\b/i,
    /\banalytics\b/i,
    /\badvertising\b/i,
    /\btargeted ads?\b/i,
    /\bbehavioral advertising\b/i,
    /\bweb beacons?\b/i,
    /\bpixels?\b/i
  ],

  sensitive_data: [
    /\blocation data\b/i,
    /\bprecise location\b/i,
    /\bbiometric\b/i,
    /\bfaceprint\b/i,
    /\bvoiceprint\b/i,
    /\bhealth data\b/i,
    /\bdevice identifiers?\b/i,
    /\bip address\b/i
  ],

  data_collection: [
    /\bcollect\b/i,
    /\bgather\b/i,
    /\bstore\b/i,
    /\bretain\b/i,
    /\bobtain\b.*\binformation\b/i,
    /\bpersonal information\b/i,
    /\bpersonal data\b/i,
    /\busage data\b/i,
    /\bdevice information\b/i
  ],

  data_sharing: [
    /\bshare\b/i,
    /\bsell\b.*\bdata\b/i,
    /\bdisclose\b/i,
    /\bthird[- ]party\b/i,
    /\baffiliates?\b/i,
    /\bpartners?\b/i,
    /\bservice providers?\b/i,
    /\btransfer\b.*\binformation\b/i
  ],

  data_retention: [
    /\bretain\b.*\bdata\b/i,
    /\bdata retention\b/i,
    /\bkeep your information\b/i,
    /\bstore your data\b/i,
    /\bdelete your data\b/i
  ],

  price_changes: [
    /\bchange\b.*\bprice\b/i,
    /\bincrease\b.*\bfee\b/i,
    /\bmodify\b.*\bpricing\b/i,
    /\bprice\b.*\bsubject to change\b/i,
    /\bfees may change\b/i
  ],

  subscription_billing: [
    /\bauto[- ]?renew\b/i,
    /\bautomatically renew\b/i,
    /\brecurring\b/i,
    /\bsubscription fee\b/i,
    /\bbilled\b/i,
    /\bcharge\b/i,
    /\bpayment method\b/i,
    /\bmonthly\b/i,
    /\bannual\b/i
  ],

  cancellation_refunds: [
    /\bcancel\b/i,
    /\brefund\b/i,
    /\brefundable\b/i,
    /\bnon[- ]refundable\b/i,
    /\bfinal sale\b/i,
    /\bno refunds?\b/i,
    /\bcancellation\b/i
  ],

  account_termination: [
    /\bterminate\b/i,
    /\bsuspend\b/i,
    /\bclose your account\b/i,
    /\bremove access\b/i,
    /\bdisable\b.*\baccount\b/i,
    /\bban\b/i
  ],

  user_content_license: [
    /\byou grant\b/i,
    /\blicense\b/i,
    /\broyalty[- ]free\b/i,
    /\bworldwide\b/i,
    /\bperpetual\b/i,
    /\birrevocable\b/i,
    /\buse your content\b/i,
    /\breproduce\b.*\bcontent\b/i
  ],

  marketing_communications: [
    /\bmarketing\b/i,
    /\bpromotional\b/i,
    /\bnewsletter\b/i,
    /\btext messages?\b/i,
    /\bsms\b/i,
    /\bemails?\b/i,
    /\bcommunications\b/i
  ],

  third_party_services: [
    /\bthird[- ]party services?\b/i,
    /\bthird[- ]party links?\b/i,
    /\bexternal services?\b/i,
    /\bintegrations?\b/i,
    /\bpayment processors?\b/i
  ],

  age_restrictions: [
    /\byou must be at least\b/i,
    /\bunder the age of\b/i,
    /\bchildren\b/i,
    /\bminor\b/i,
    /\bparent or guardian\b/i,
    /\bage requirement\b/i
  ],

  terms_changes: [
    /\bmay modify these terms\b/i,
    /\bmay update these terms\b/i,
    /\bchange these terms\b/i,
    /\brevise these terms\b/i,
    /\bat any time\b/i,
    /\bwithout notice\b/i
  ],

  liability_limits: [
    /\bliability\b/i,
    /\blimited liability\b/i,
    /\bnot liable\b/i,
    /\bno warranties?\b/i,
    /\bas is\b/i,
    /\bdisclaimer of warranties\b/i,
    /\bto the fullest extent permitted by law\b/i,
    /\bindirect damages?\b/i
  ],

  arbitration_disputes: [
    /\barbitration\b/i,
    /\bdispute\b/i,
    /\bclass action\b/i,
    /\bwaiver\b/i,
    /\bgoverning law\b/i,
    /\bvenue\b/i,
    /\bjurisdiction\b/i,
    /\bcourt\b/i
  ]
};

function normalizeClauseText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()
    .toLowerCase();
}

function dedupeClauses(clauses) {
  const seen = new Set();

  return clauses.filter(clause => {
    const key = `${clause.type}::${normalizeClauseText(clause.text)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function detectClauses(blocks) {
  const results = [];

  blocks.forEach(block => {
    const sentences = splitIntoSentences(block.text);

    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length < 25) return;

      for (const [type, patterns] of Object.entries(CLAUSE_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(trimmedSentence))) {
          results.push({
            type,
            text: trimmedSentence,
            node: block.node,
            highlightElement: null
          });
          break;
        }
      }
    });
  });

  return dedupeClauses(results);
}