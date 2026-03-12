
(function(){
  const $ = (s)=>document.querySelector(s);
  const el = (tag,attrs={},children=[])=>{
    const n=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==="class") n.className=v;
      else if(k==="html") n.innerHTML=v;
      else n.setAttribute(k,v);
    });
    (Array.isArray(children)?children:[children]).forEach(c=>{
      if(c==null) return;
      if(typeof c==="string") n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    });
    return n;
  };
  const fmt = (n, d=2) => isFinite(n) ? Number(n).toLocaleString(undefined,{maximumFractionDigits:d}) : "—";
  const readNum=(id)=> parseFloat((document.getElementById(id)?.value||"").toString().replace(/,/g,"")) || 0;
  const readStr=(id)=> (document.getElementById(id)?.value||"").toString();
  const resultBox=$("#resultBox");
  const fields=$("#fields");
  const related=$("#relatedTools");
  const searchForm=$("#searchForm");
  const searchInput=$("#siteSearch");
  const cfg=window.PAGE_CONFIG || {};
  const pools=(window.TOOL_DATA||{}).word_pools||{};
  const messages=(window.TOOL_DATA||{}).messages||{};
  const helpers={
    daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000);},
    businessDays(a,b){
      let d1=new Date(a), d2=new Date(b); if(d1>d2){const t=d1;d1=d2;d2=t}
      let c=0;
      for(let d=new Date(d1); d<=d2; d.setDate(d.getDate()+1)){const day=d.getDay(); if(day!==0 && day!==6) c++;}
      return c;
    },
    randomItem(arr){return arr[Math.floor(Math.random()*arr.length)]},
    rand(min,max){return Math.floor(Math.random()*(max-min+1))+min},
    slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")},
    escapeHtml(s){return s.replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))},
    luhn(num){
      const arr=(num+"").replace(/\D/g,"").split("").reverse().map(Number);
      let sum=0;
      for(let i=0;i<arr.length;i++){let n=arr[i]; if(i%2===1){n*=2; if(n>9)n-=9;} sum+=n;}
      return sum%10===0 && arr.length>=12;
    }
  };

  function setResult(title, lines){
    resultBox.innerHTML="";
    resultBox.appendChild(el("div",{class:"big"},title));
    if(Array.isArray(lines)){
      const ul=el("div",{class:"list"});
      lines.forEach(x=>ul.appendChild(el("div",{},x)));
      resultBox.appendChild(ul);
    }else if(typeof lines==="string"){
      resultBox.appendChild(el("pre",{},lines));
    }else if(lines && typeof lines==="object"){
      const grid=el("div",{class:"kpis"});
      Object.entries(lines).forEach(([k,v])=>{
        grid.appendChild(el("div",{class:"kpi"},[el("span",{class:"small"},k),el("b",{},v)]));
      });
      resultBox.appendChild(grid);
    }
  }

  function addField(type,id,label,placeholder="",value=""){
    const wrap=el("div");
    wrap.appendChild(el("label",{for:id},label));
    const inp= type==="textarea"
      ? el("textarea",{id,placeholder},value)
      : el("input",{id,type,placeholder,value});
    wrap.appendChild(inp);
    fields.appendChild(wrap);
  }

  function addSelect(id,label,options){
    const wrap=el("div");
    wrap.appendChild(el("label",{for:id},label));
    const sel=el("select",{id});
    options.forEach(o=> sel.appendChild(el("option",{value:o.value},o.label)));
    wrap.appendChild(sel);
    fields.appendChild(wrap);
  }

  function renderForm(){
    fields.innerHTML="";
    const e=cfg.engine;
    if(["age","date_diff","business_days"].includes(e)){
      addField("date","a","Start date");
      addField("date","b","End date");
    } else if(e==="timezone"){
      addField("text","cityA","City or label A","Seoul","Seoul");
      addField("number","offsetA","UTC offset A","+9","9");
      addField("text","cityB","City or label B","London","London");
      addField("number","offsetB","UTC offset B","+0","0");
    } else if(e==="hours_between"){
      addField("time","a","Start time","09:00","09:00");
      addField("time","b","End time","17:00","17:00");
      addField("number","rate","Hourly rate (optional)","20","20");
    } else if(["percent","discount","tax"].includes(e)){
      addField("number","amount","Amount","100","100");
      addField("number","rate","Rate (%)","10","10");
    } else if(e==="loan"){
      addField("number","amount","Loan amount","10000","10000");
      addField("number","rate","Annual interest rate (%)","6","6");
      addField("number","months","Loan term (months)","36","36");
    } else if(e==="compound_interest"){
      addField("number","amount","Initial amount","1000","1000");
      addField("number","monthly","Monthly contribution","100","100");
      addField("number","rate","Annual return (%)","8","8");
      addField("number","years","Years","10","10");
    } else if(e==="simple_interest"){
      addField("number","amount","Principal","1000","1000");
      addField("number","rate","Annual rate (%)","5","5");
      addField("number","years","Years","3","3");
    } else if(e==="salary"){
      addField("number","hourly","Hourly pay","25","25");
      addField("number","hours","Hours per week","40","40");
    } else if(e==="salary_to_hourly"){
      addField("number","salary","Annual salary","60000","60000");
      addField("number","hours","Hours per week","40","40");
    } else if(e==="hourly_to_salary"){
      addField("number","hourly","Hourly pay","25","25");
      addField("number","hours","Hours per week","40","40");
    } else if(e==="tip"){
      addField("number","amount","Bill amount","60","60");
      addField("number","rate","Tip rate (%)","15","15");
      addField("number","people","People","2","2");
    } else if(e==="bmi"){
      addField("number","height","Height (cm)","170","170");
      addField("number","weight","Weight (kg)","65","65");
    } else if(e==="calorie"){
      addField("number","weight","Weight (kg)","70","70");
      addField("number","height","Height (cm)","175","175");
      addField("number","age","Age","30","30");
      addSelect("sex","Sex",[{value:"male",label:"Male"},{value:"female",label:"Female"}]);
    } else if(e==="due_date"){
      addField("date","a","Last period date");
    } else if(e==="profit"){
      addField("number","revenue","Revenue","1000","1000");
      addField("number","cost","Cost","700","700");
    } else if(e==="fuel"){
      addField("number","distance","Distance","100","100");
      addField("number","efficiency","Efficiency (km/L)","12","12");
      addField("number","price","Fuel price per liter","1.5","1.5");
    } else if(e==="utility"){
      addField("number","usage","Usage units","300","300");
      addField("number","price","Price per unit","0.2","0.2");
    } else if(e==="gpa"){
      addField("textarea","grades","Enter grades as score,weight per line","90,3\n85,4\n78,2","90,3\n85,4\n78,2");
    } else if(e==="text_stats"){
      addField("textarea","text","Paste text","Type or paste text here","Type or paste text here");
    } else if(e==="screen"){
      addField("number","diag","Diagonal inches","27","27");
      addField("number","widthpx","Width px","2560","2560");
      addField("number","heightpx","Height px","1440","1440");
    } else if(e==="download_time"){
      addField("number","size","File size (MB)","1500","1500");
      addField("number","speed","Speed (Mbps)","100","100");
    } else if(e==="area_cost"){
      addField("number","width","Width","5","5");
      addField("number","height","Height","4","4");
      addField("number","unitCost","Cost per unit area","12","12");
    } else if(e==="geometry"){
      addField("number","a","Value A","10","10");
      addField("number","b","Value B","5","5");
      addField("number","c","Value C (optional)","2","2");
    } else if(e==="ohms"){
      addField("number","voltage","Voltage (V)","12","12");
      addField("number","resistance","Resistance (Ω)","6","6");
    } else if(e==="weather"){
      addField("number","temp","Temperature (°C)","30","30");
      addField("number","humidity","Humidity (%)","70","70");
      addField("number","wind","Wind speed (km/h)","10","10");
    } else if(e==="recipe"){
      addField("number","servings","Current servings","4","4");
      addField("number","target","Target servings","8","8");
      addField("number","amount","Ingredient amount","250","250");
    } else if(e==="simple_ratio"){
      addField("number","a","Value A","10","10");
      addField("number","b","Multiplier","7","7");
    } else if(e==="cost_share"){
      addField("number","amount","Amount","2000","2000");
      addField("number","rate","Rate (%)","10","10");
    } else if(e==="finance_ratio"){
      addField("number","a","Value A","500","500");
      addField("number","b","Value B","250","250");
      addField("number","c","Value C (optional)","12","12");
    } else if(e==="basic_formula"){
      addField("number","a","Value A","100","100");
      addField("number","b","Value B","25","25");
    } else if(e==="converter"){
      addField("number","x","Value",cfg.from_unit||"1","1");
    } else if(["password","random_number","random_color","random_date","pick_list","message","uuid","slug","lorem","gradient","palette","binary","fake_data","name_combo"].includes(e)){
      if(e==="password"){ addField("number","len","Length","14","14"); }
      else if(e==="random_number"){ addField("number","min","Minimum","1","1"); addField("number","max","Maximum","100","100"); }
      else if(e==="slug"){ addField("text","text","Text","My New Title","My New Title"); }
      else if(e==="binary"){ addField("text","text","Text","hello","hello"); }
      else if(e==="lorem"){ addField("number","count","Paragraphs","2","2"); }
      else if(e==="fake_data"){ addField("number","count","Rows","3","3"); }
      else { addField("text","seed","Optional keyword","smart","smart"); }
    } else if(["password_strength","email","username","ip","seo_title","meta","keyword_density","duplicate_lines","text_analysis","file_meta","port","json","xml","code","contrast","font","slug_check","regex","palindrome","anagram","prime","credit_card","iban","isbn","url","url_info"].includes(e)){
      if(e==="contrast"){ addField("text","fg","Foreground color","#111111","#111111"); addField("text","bg","Background color","#ffffff","#ffffff"); }
      else if(e==="regex"){ addField("text","pattern","Regex pattern","\\d+","\\d+"); addField("text","text","Text","abc 123","abc 123"); }
      else if(e==="prime"){ addField("number","n","Number","97","97"); }
      else if(e==="credit_card"){ addField("text","text","Card number","4111111111111111","4111111111111111"); }
      else if(e==="iban"){ addField("text","text","IBAN","GB82WEST12345698765432","GB82WEST12345698765432"); }
      else if(e==="isbn"){ addField("text","text","ISBN","9780306406157","9780306406157"); }
      else if(e==="url_info" || e==="url"){ addField("text","text","URL","https://example.com","https://example.com"); }
      else if(e==="ip"){ addField("text","text","IP address","8.8.8.8","8.8.8.8"); }
      else if(e==="port"){ addField("number","n","Port","443","443"); }
      else { addField("textarea","text","Input","Paste your text here","Paste your text here"); }
    } else {
      addField("text","text","Input","Hello","Hello");
    }
  }

  function calc(){
    const e=cfg.engine;
    try{
      if(e==="age"){
        const d=readStr("a"); if(!d) return setResult("Enter a date","Pick a birth date.");
        const days=helpers.daysBetween(d,new Date().toISOString().slice(0,10));
        setResult(fmt(days/365.25,1)+" years",{"Days":fmt(days,0),"Months":fmt(days/30.44,1),"Weeks":fmt(days/7,1)});
      } else if(e==="date_diff"){
        const d=helpers.daysBetween(readStr("a"),readStr("b")); setResult(fmt(Math.abs(d),0)+" days",{"Difference":fmt(Math.abs(d),0),"Weeks":fmt(Math.abs(d)/7,1)});
      } else if(e==="business_days"){
        const d=helpers.businessDays(readStr("a"),readStr("b")); setResult(fmt(d,0)+" business days","Weekends excluded.");
      } else if(e==="timezone"){
        const oa=readNum("offsetA"), ob=readNum("offsetB");
        const now=new Date(); const utc=now.getTime()+now.getTimezoneOffset()*60000;
        const ta=new Date(utc+oa*3600000); const tb=new Date(utc+ob*3600000);
        setResult("Time comparison",{[readStr("cityA")||"A"]:ta.toLocaleTimeString(),[readStr("cityB")||"B"]:tb.toLocaleTimeString(),"Hour difference":fmt(oa-ob,1)});
      } else if(e==="hours_between"){
        const a=readStr("a"), b=readStr("b");
        const [ah,am]=a.split(":").map(Number), [bh,bm]=b.split(":").map(Number);
        let hours=(bh+bm/60)-(ah+am/60); if(hours<0) hours+=24;
        setResult(fmt(hours,2)+" hours",{"Worked hours":fmt(hours,2),"Estimated pay":fmt(hours*readNum("rate"),2)});
      } else if(e==="percent"){
        const amount=readNum("amount"), rate=readNum("rate"); const part=amount*rate/100;
        setResult(fmt(part,2),{"Percent value":fmt(part,2),"New total":fmt(amount+part,2),"Rate":fmt(rate,2)+"%"});
      } else if(e==="discount"){
        const amount=readNum("amount"), rate=readNum("rate"); const save=amount*rate/100;
        setResult(fmt(amount-save,2),{"Original":fmt(amount,2),"You save":fmt(save,2),"Discount":fmt(rate,2)+"%"});
      } else if(e==="tax"){
        const amount=readNum("amount"), rate=readNum("rate"); const tax=amount*rate/100;
        setResult(fmt(amount+tax,2),{"Before tax":fmt(amount,2),"Tax":fmt(tax,2),"After tax":fmt(amount+tax,2)});
      } else if(e==="loan"){
        const P=readNum("amount"), r=readNum("rate")/1200, n=readNum("months");
        const m=r===0?P/n:P*r/(1-Math.pow(1+r,-n));
        setResult(fmt(m,2)+" / month",{"Monthly payment":fmt(m,2),"Total paid":fmt(m*n,2),"Interest paid":fmt(m*n-P,2)});
      } else if(e==="compound_interest"){
        const principal=readNum("amount"), contrib=readNum("monthly"), rate=readNum("rate")/100/12, months=readNum("years")*12;
        let balance=principal;
        for(let i=0;i<months;i++) balance=balance*(1+rate)+contrib;
        setResult(fmt(balance,2),{"Future value":fmt(balance,2),"Contributions":fmt(principal+contrib*months,2),"Growth":fmt(balance-(principal+contrib*months),2)});
      } else if(e==="simple_interest"){
        const p=readNum("amount"), rate=readNum("rate")/100, years=readNum("years");
        const i=p*rate*years;
        setResult(fmt(p+i,2),{"Interest":fmt(i,2),"Final amount":fmt(p+i,2)});
      } else if(e==="salary"){
        const hourly=readNum("hourly"), hours=readNum("hours");
        setResult(fmt(hourly*hours*52,2),{"Annual":fmt(hourly*hours*52,2),"Monthly":fmt(hourly*hours*52/12,2),"Weekly":fmt(hourly*hours,2)});
      } else if(e==="salary_to_hourly"){
        const salary=readNum("salary"), hours=readNum("hours");
        setResult(fmt(salary/(hours*52),2)+" / hour","Based on 52 weeks per year.");
      } else if(e==="hourly_to_salary"){
        const hourly=readNum("hourly"), hours=readNum("hours");
        setResult(fmt(hourly*hours*52,2)+" / year","Based on 52 weeks per year.");
      } else if(e==="tip"){
        const amount=readNum("amount"), rate=readNum("rate"), people=Math.max(1,readNum("people"));
        const tip=amount*rate/100, total=amount+tip;
        setResult(fmt(total,2),{"Tip":fmt(tip,2),"Total":fmt(total,2),"Per person":fmt(total/people,2)});
      } else if(e==="bmi"){
        const h=readNum("height")/100,w=readNum("weight"); const bmi=w/(h*h);
        const category=bmi<18.5?"Underweight":bmi<25?"Normal":bmi<30?"Overweight":"Obese";
        setResult(fmt(bmi,1),{"Category":category,"Weight":fmt(w,1)+" kg","Height":fmt(h*100,0)+" cm"});
      } else if(e==="calorie"){
        const weight=readNum("weight"), height=readNum("height"), age=readNum("age"), male=readStr("sex")==="male";
        const bmr=(10*weight)+(6.25*height)-(5*age)+(male?5:-161);
        setResult(fmt(bmr,0)+" kcal",{"BMR":fmt(bmr,0),"Lightly active":fmt(bmr*1.375,0),"Moderately active":fmt(bmr*1.55,0)});
      } else if(e==="due_date"){
        const d=new Date(readStr("a")); const due=new Date(d); due.setDate(d.getDate()+280);
        const ov=new Date(d); ov.setDate(d.getDate()+14);
        setResult(due.toISOString().slice(0,10),{"Estimated due date":due.toISOString().slice(0,10),"Approx ovulation":ov.toISOString().slice(0,10)});
      } else if(e==="profit"){
        const rev=readNum("revenue"), cost=readNum("cost"), profit=rev-cost;
        setResult(fmt(profit,2),{"Profit":fmt(profit,2),"Margin":fmt((profit/rev||0)*100,2)+"%","Markup":fmt((profit/cost||0)*100,2)+"%"});
      } else if(e==="fuel"){
        const dist=readNum("distance"), eff=readNum("efficiency"), price=readNum("price"); const liters=dist/eff;
        setResult(fmt(liters*price,2),{"Fuel used":fmt(liters,2)+" L","Trip cost":fmt(liters*price,2),"Distance":fmt(dist,2)});
      } else if(e==="utility"){
        const usage=readNum("usage"), price=readNum("price");
        setResult(fmt(usage*price,2),{"Usage":fmt(usage,2),"Unit price":fmt(price,2),"Total":fmt(usage*price,2)});
      } else if(e==="gpa"){
        const rows=readStr("grades").split(/\n+/).map(x=>x.trim()).filter(Boolean);
        let sum=0,w=0;
        rows.forEach(r=>{ const [score,weight]=r.split(",").map(Number); sum+=score*weight; w+=weight; });
        setResult(fmt(sum/(w||1),2),{"Weighted average":fmt(sum/(w||1),2),"Total weight":fmt(w,2)});
      } else if(e==="text_stats"){
        const t=readStr("text").trim(); const words=t?t.split(/\s+/).length:0; const chars=t.length;
        setResult(fmt(words,0)+" words",{"Characters":fmt(chars,0),"Reading time":fmt(words/200,1)+" min","Lines":fmt(t.split(/\n/).length,0)});
      } else if(e==="screen"){
        const d=readNum("diag"), w=readNum("widthpx"), h=readNum("heightpx");
        const ppi=Math.sqrt(w*w+h*h)/d;
        setResult(fmt(ppi,1)+" PPI",{"Resolution":w+"×"+h,"Aspect ratio":fmt(w/h,2)+":1","Pixel density":fmt(ppi,1)});
      } else if(e==="download_time"){
        const size=readNum("size"), speed=readNum("speed"); const seconds=(size*8)/speed;
        setResult(fmt(seconds/60,2)+" min",{"Seconds":fmt(seconds,1),"Minutes":fmt(seconds/60,2),"Hours":fmt(seconds/3600,2)});
      } else if(e==="area_cost"){
        const w=readNum("width"), h=readNum("height"), c=readNum("unitCost"); const area=w*h;
        setResult(fmt(area,2),{"Area":fmt(area,2),"Estimated cost":fmt(area*c,2),"Perimeter":fmt((w+h)*2,2)});
      } else if(e==="geometry"){
        const a=readNum("a"), b=readNum("b"), c=readNum("c");
        setResult(fmt(a*b,2),{"A × B":fmt(a*b,2),"A + B + C":fmt(a+b+c,2),"Average":fmt((a+b+c)/3,2)});
      } else if(e==="ohms"){
        const v=readNum("voltage"), r=readNum("resistance"), i=v/r;
        setResult(fmt(i,2)+" A",{"Current":fmt(i,2)+" A","Power":fmt(v*i,2)+" W","Resistance":fmt(r,2)+" Ω"});
      } else if(e==="weather"){
        const t=readNum("temp"), h=readNum("humidity"), w=readNum("wind");
        const heat=t + 0.33*h/10 - 0.7*w/10 - 4;
        setResult(fmt(heat,1)+" °C",{"Feels like":fmt(heat,1)+" °C","Humidity":fmt(h,0)+"%","Wind":fmt(w,1)+" km/h"});
      } else if(e==="recipe"){
        const s=readNum("servings"), target=readNum("target"), amount=readNum("amount");
        const scaled=amount*(target/(s||1));
        setResult(fmt(scaled,2),{"Scaled amount":fmt(scaled,2),"Scale factor":fmt(target/(s||1),2)});
      } else if(e==="simple_ratio"){
        const a=readNum("a"), b=readNum("b");
        setResult(fmt(a*b,2),{"Result":fmt(a*b,2),"Input":fmt(a,2),"Multiplier":fmt(b,2)});
      } else if(e==="cost_share"){
        const a=readNum("amount"), rate=readNum("rate")/100;
        setResult(fmt(a*rate,2),{"Rate amount":fmt(a*rate,2),"Base amount":fmt(a,2),"Total":fmt(a+a*rate,2)});
      } else if(e==="finance_ratio"){
        const a=readNum("a"), b=readNum("b"), c=readNum("c");
        setResult(fmt(a/(b||1),2),{"Ratio A/B":fmt(a/(b||1),2),"Percent":fmt((a/(b||1))*100,2)+"%","Annualized":fmt((a/(b||1))*c,2)});
      } else if(e==="basic_formula"){
        const a=readNum("a"), b=readNum("b");
        setResult(fmt(a+b,2),{"Add":fmt(a+b,2),"Subtract":fmt(a-b,2),"Multiply":fmt(a*b,2)});
      } else if(e==="converter"){
        const x=readNum("x");
        const y=Function("x","return "+cfg.formula)(x);
        setResult(fmt(y,6)+" "+cfg.to_unit, {[cfg.from_unit]:fmt(x,6), [cfg.to_unit]:fmt(y,6)});
      } else if(e==="password"){
        const len=Math.max(4,Math.min(64,readNum("len")||12)); const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        let out=""; for(let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
        setResult(out,{"Length":String(len),"Strong characters":"letters, numbers, symbols"});
      } else if(e==="random_number"){
        const min=readNum("min"), max=readNum("max"); const n=helpers.rand(min,max);
        setResult(String(n),{"Range":min+" to "+max});
      } else if(e==="random_color"){
        const c="#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");
        setResult(c,{Preview:"",Hex:c});
        resultBox.querySelector(".kpis").prepend(el("div",{class:"kpi",style:"background:"+c+";min-height:96px"}));
      } else if(e==="random_date"){
        const start=new Date(2000,0,1).getTime(), end=Date.now();
        const d=new Date(start+Math.random()*(end-start));
        setResult(d.toISOString().slice(0,10),"Random date generated.");
      } else if(e==="pick_list"){
        const item=helpers.randomItem(pools[cfg.pool]||["sample"]);
        setResult(item,"Tap generate again for a new result.");
      } else if(e==="message"){
        const item=helpers.randomItem(messages[cfg.pool]||["Hello there."]);
        setResult(item,"Ready to copy.");
      } else if(e==="uuid"){
        const id=crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==="x"?r:(r&0x3|0x8);return v.toString(16);});
        setResult(id,"UUID v4 style.");
      } else if(e==="slug"){
        setResult(helpers.slugify(readStr("text")),"URL-friendly slug.");
      } else if(e==="lorem"){
        const p=Math.max(1,Math.min(8,readNum("count")||2));
        const para="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non velit ac augue faucibus dapibus. ";
        setResult(Array.from({length:p},()=>para.repeat(3)).join("\n\n"),"Generated placeholder text.");
      } else if(e==="gradient"){
        const c1="#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");
        const c2="#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");
        const css="linear-gradient(135deg, "+c1+", "+c2+")";
        setResult(css,{Color1:c1,Color2:c2});
        resultBox.querySelector(".kpis").prepend(el("div",{class:"kpi",style:"background:"+css+";min-height:96px"}));
      } else if(e==="palette"){
        const list=Array.from({length:5},()=>"#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0"));
        setResult(list.join(" · "),"5-color palette.");
      } else if(e==="binary"){
        const text=readStr("text");
        setResult(text.split("").map(ch=>ch.charCodeAt(0).toString(2).padStart(8,"0")).join(" "),"Binary output.");
      } else if(e==="fake_data"){
        const count=Math.max(1,Math.min(10,readNum("count")||3));
        const rows=[];
        for(let i=1;i<=count;i++) rows.push(`User ${i}, user${i}@example.com, Order-${1000+i}`);
        setResult(rows.join("\n"),"Sample rows.");
      } else if(e==="name_combo"){
        const seed=readStr("seed");
        const a=helpers.randomItem(pools.adjectives), b=helpers.randomItem(pools.nouns);
        const out=(seed?seed+" ":"")+a+" "+b;
        setResult(out.replace(/\b\w/g,m=>m.toUpperCase()),"Generated from word combinations.");
      } else if(e==="password_strength"){
        const t=readStr("text"); let score=0;
        if(t.length>=8) score++; if(/[A-Z]/.test(t)) score++; if(/[a-z]/.test(t)) score++; if(/\d/.test(t)) score++; if(/[^A-Za-z0-9]/.test(t)) score++;
        const level=score<=2?"Weak":score===3?"Fair":score===4?"Good":"Strong";
        setResult(level,{"Length":String(t.length),"Score":score+"/5"});
      } else if(e==="email"){
        const t=readStr("text")||readStr("text");
        setResult(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)?"Valid email":"Invalid email","Basic email pattern check.");
      } else if(e==="username"){
        const t=readStr("text");
        const ok=/^[a-zA-Z0-9_]{3,20}$/.test(t);
        setResult(ok?"Looks available format-wise":"Invalid format","This checks naming rules only.");
      } else if(e==="ip"){
        const t=readStr("text");
        const ok=/^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/.test(t);
        setResult(ok?"Valid IPv4":"Invalid IPv4","Format validation only.");
      } else if(e==="seo_title"){
        const t=readStr("text");
        setResult(t.length<=60?"Good length":"Too long",{"Characters":String(t.length),"Ideal":"50–60"});
      } else if(e==="meta"){
        const t=readStr("text");
        setResult(t.length<=160?"Good length":"Too long",{"Characters":String(t.length),"Ideal":"120–160"});
      } else if(e==="keyword_density"){
        const t=readStr("text").toLowerCase(); const words=t.match(/\b[a-z0-9]+\b/g)||[];
        const map={}; words.forEach(w=>map[w]=(map[w]||0)+1);
        const top=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k}: ${((v/words.length)*100).toFixed(2)}%`);
        setResult(top.join("\n"),"Top keyword density.");
      } else if(e==="duplicate_lines"){
        const lines=readStr("text").split(/\n/).map(x=>x.trim()).filter(Boolean); const seen=new Set(), dup=[];
        lines.forEach(l=>{if(seen.has(l)&&!dup.includes(l)) dup.push(l); seen.add(l)});
        setResult(dup.length?dup.join("\n"):"No duplicate lines found","Duplicate line check.");
      } else if(e==="text_analysis"){
        const t=readStr("text"); const words=(t.match(/\b\S+\b/g)||[]).length;
        setResult("Text summary",{"Words":String(words),"Characters":String(t.length),"Whitespace":String((t.match(/\s/g)||[]).length)});
      } else if(e==="file_meta"){
        const t=readStr("text");
        setResult("Quick info",{"Characters":String(t.length),"Likely mime":t.trim().startsWith("{")?"application/json":"text/plain"});
      } else if(e==="port"){
        const n=readNum("n"); const common={80:"HTTP",443:"HTTPS",21:"FTP",22:"SSH",25:"SMTP",3306:"MySQL"};
        setResult(common[n]||"Unknown / custom",{"Port":String(n)});
      } else if(e==="json"){
        const t=readStr("text"); try{ JSON.parse(t); setResult("Valid JSON","Parsing passed."); } catch(err){ setResult("Invalid JSON",String(err.message)); }
      } else if(e==="xml"){
        const t=readStr("text"); const ok=/^\s*<[^>]+>[\s\S]*<\/[^>]+>\s*$/.test(t);
        setResult(ok?"Looks like XML":"Invalid XML","Basic structure check.");
      } else if(e==="code"){
        const t=readStr("text");
        setResult("Code summary",{"Characters":String(t.length),"Lines":String(t.split(/\n/).length)});
      } else if(e==="contrast"){
        const fg=readStr("fg"), bg=readStr("bg");
        function lum(hex){ hex=hex.replace("#",""); if(hex.length===3) hex=hex.split("").map(x=>x+x).join(""); const rgb=[0,2,4].map(i=>parseInt(hex.substr(i,2),16)/255).map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)); return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];}
        const ratio=((Math.max(lum(fg),lum(bg))+0.05)/(Math.min(lum(fg),lum(bg))+0.05)).toFixed(2);
        setResult(ratio+":1",{"WCAG AA text":ratio>=4.5?"Pass":"Fail","WCAG AA large":ratio>=3?"Pass":"Fail"});
      } else if(e==="font"){
        const pairs=["Inter + Merriweather","Roboto + Lora","Poppins + Source Serif 4","Montserrat + Roboto","Oswald + Open Sans"];
        setResult(helpers.randomItem(pairs),"Suggested font pairing.");
      } else if(e==="slug_check"){
        const t=readStr("text"); const slug=helpers.slugify(t);
        setResult(slug===t?"Already slug-friendly":"Suggested slug",slug);
      } else if(e==="regex"){
        try{ const r=new RegExp(readStr("pattern"),"g"); const matches=readStr("text").match(r)||[]; setResult(matches.length+" matches",matches.join(", ")||"No matches"); }
        catch(err){ setResult("Invalid regex",String(err.message)); }
      } else if(e==="palindrome"){
        const t=(readStr("text")||"").toLowerCase().replace(/[^a-z0-9]/g,"");
        setResult(t===t.split("").reverse().join("")?"Palindrome":"Not a palindrome","Alphanumeric check.");
      } else if(e==="anagram"){
        const lines=readStr("text").split(/\n+/); const a=(lines[0]||"").toLowerCase().replace(/[^a-z0-9]/g,"").split("").sort().join(""); const b=(lines[1]||"").toLowerCase().replace(/[^a-z0-9]/g,"").split("").sort().join("");
        setResult(a&&a===b?"Anagram":"Not an anagram","Put two lines of text to compare.");
      } else if(e==="prime"){
        const n=readNum("n"); let ok=n>1; for(let i=2;i<=Math.sqrt(n);i++){ if(n%i===0){ok=false;break;}}
        setResult(ok?"Prime":"Not prime","Simple prime test.");
      } else if(e==="credit_card"){
        const n=readStr("text"); setResult(helpers.luhn(n)?"Valid checksum":"Invalid checksum","Luhn algorithm.");
      } else if(e==="iban"){
        const iban=readStr("text").replace(/\s+/g,"").toUpperCase(); const ok=/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban);
        setResult(ok?"Looks valid":"Invalid format","Basic IBAN format check.");
      } else if(e==="isbn"){
        const isbn=readStr("text").replace(/[^0-9X]/gi,""); setResult([10,13].includes(isbn.length)?"Valid length":"Invalid length","ISBN-10 or ISBN-13 length check.");
      } else if(e==="url" || e==="url_info"){
        const t=readStr("text"); const ok=/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(t);
        setResult(ok?"Valid URL":"Invalid URL",{"Protocol":t.startsWith("https")?"HTTPS":t.startsWith("http")?"HTTP":"None","Length":String(t.length)});
      } else {
        setResult("Ready","Tool initialized.");
      }
    }catch(err){
      setResult("Error",String(err.message));
    }
  }

  function renderRelated(){
    related.innerHTML="";
    (cfg.related||[]).forEach(item=>{
      const href=item.category==="home" ? "/" : "/"+item.category+"/"+item.slug+"/";
      related.appendChild(el("a",{href},item.title));
    });
  }

  function doSearch(evt){
    evt?.preventDefault();
    const q=(searchInput.value||"").toLowerCase().trim();
    if(!q) return;
    const all=(window.TOOL_INDEX||[]);
    const hit=all.find(t=>t.name.toLowerCase()===q) || all.find(t=>t.name.toLowerCase().includes(q));
    if(hit){ location.href="/"+hit.category+"/"+hit.slug+"/"; }
  }

  document.addEventListener("click",(e)=>{
    if(e.target.matches("[data-action=run]")) calc();
    if(e.target.matches("[data-action=reset]")) { renderForm(); setResult("Ready","Enter values and click Calculate."); }
  });
  searchForm?.addEventListener("submit",doSearch);
  renderForm();
  renderRelated();
  calc();
})();
