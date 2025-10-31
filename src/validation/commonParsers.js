export function parseCommonAppHdrFields(xml) {
  const fields = {};
  
  const fromMatch = xml.match(/<Fr>[\s\S]*?<Id>([^<]+)<\/Id>/);
  fields.fromISPB = fromMatch ? fromMatch[1] : null;
  
  const toMatch = xml.match(/<To>[\s\S]*?<Id>([^<]+)<\/Id>/);
  fields.toISPB = toMatch ? toMatch[1] : null;
  
  const bizMsgIdrMatch = xml.match(/<BizMsgIdr>([^<]+)<\/BizMsgIdr>/);
  fields.bizMsgIdr = bizMsgIdrMatch ? bizMsgIdrMatch[1] : null;
  
  const msgDefIdrMatch = xml.match(/<MsgDefIdr>([^<]+)<\/MsgDefIdr>/);
  fields.msgDefIdr = msgDefIdrMatch ? msgDefIdrMatch[1] : null;
  
  const creDtMatch = xml.match(/<CreDt>([^<]+)<\/CreDt>/);
  fields.creDt = creDtMatch ? creDtMatch[1] : null;
  
  const grpHdrMsgIdMatch = xml.match(/<GrpHdr>[\s\S]*?<MsgId>([^<]+)<\/MsgId>/);
  fields.grpHdrMsgId = grpHdrMsgIdMatch ? grpHdrMsgIdMatch[1] : null;
  
  const creDtTmMatch = xml.match(/<CreDtTm>([^<]+)<\/CreDtTm>/);
  fields.creDtTm = creDtTmMatch ? creDtTmMatch[1] : null;
  
  return fields;
}

export function parseNbOfTxs(xml) {
  const nbOfTxsMatch = xml.match(/<NbOfTxs>([^<]+)<\/NbOfTxs>/);
  return nbOfTxsMatch ? Number.parseInt(nbOfTxsMatch[1], 10) : null;
}

