// Official Codex app-server RPC transport; OAuth credentials stay inside Codex.
// Does not start a model turn, create a chat, or read credential stores.
import {spawn} from 'node:child_process';
import readline from 'node:readline';
import fs from 'node:fs';
const child=spawn('codex',['app-server','proxy'],{stdio:['pipe','pipe','pipe'],windowsHide:true});
let sequence=0;const pending=new Map();
const lines=readline.createInterface({input:child.stdout});
lines.on('line',line=>{try{const message=JSON.parse(line);if(message.id!=null&&pending.has(message.id)){const job=pending.get(message.id);pending.delete(message.id);clearTimeout(job.timer);message.error?job.reject(Error(message.error.message)):job.resolve(message.result);}else if(message.id!=null&&message.method){child.stdin.write(JSON.stringify({id:message.id,error:{code:-32601,message:'Interactive approval must be handled in the authorized desktop client'}})+'\n');}}catch{/* Ignore non-protocol startup text. */}});
child.stderr.on('data',()=>{}); // Never echo provider diagnostics that could include credentials.
function request(method,params){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP request timed out: '+method))},90000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,method,params})+'\n')})}
try{
 await request('initialize',{clientInfo:{name:'axora-mcp-audit',version:'1.0.0'},capabilities:{experimentalApi:true,requestAttestation:false}});
 child.stdin.write(JSON.stringify({method:'initialized'})+'\n');
 const threadId=process.env.CODEX_THREAD_ID;if(!threadId)throw Error('Current authorized thread required');
 const status=await request('mcpServerStatus/list',{threadId,serverName:'axora_supabase'});
 if(process.argv[2]){
  const command=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const result=await request('mcpServer/tool/call',{threadId,server:'axora_supabase',tool:command.tool,arguments:command.arguments});
  if(command.output)fs.writeFileSync(command.output,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
 }else{
  fs.writeFileSync('qa-evidence/automated-quotation/mcp-tools.json',JSON.stringify(status,null,2));
  console.log(JSON.stringify(status,null,2));
 }
}catch(error){console.log({ok:false,error:error.message});process.exitCode=1;}
finally{for(const job of pending.values())clearTimeout(job.timer);lines.close();child.kill();}
