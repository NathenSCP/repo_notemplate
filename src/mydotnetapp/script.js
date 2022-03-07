function Calc(a,b)
{
    DotNet.invokeMethodAsync('BlazorApp', 'HelloWorld',a,b)
      .then(data => {
        console.log('Calc return');
        Microsoft.Dynamics.NAV.InvokeExtensibilityMethod('Result',[data]);
      });
}
function Ping(data)
{
    console.log('Ping start');
    //debugger;
    //var str = 'BEGIN:VCARD VERSION:3.0 N:Lee;Jimmy;;; FN:Jimmy Lee TEL;TYPE=CELL:4168523456 TEL;TYPE=HOME:4162538965 TEL;TYPE=WORK:9058219476 TEL;TYPE=VOICE:6581236548 EMAIL;TYPE=WORK:Jimmy.Lee@scpllp.com EMAIL;TYPE=HOME:jimmy@yahoo.com X-SAMSUNGADR:;;67 Entity Dr.;Markham;On;L78 14b;Ca;67 Entity Dr. nMarkham , On L78 14b nCa ADR;TYPE=HOME:;;67 Entity Dr.;Markham;On;L78 14b;Ca X-SAMSUNGADR:;;567 Wall St;Toronto;On;L6v 4c6;Ca;567 Wall St nToronto , On L6v 4c6 nCa ADR;TYPE=WORK:;;567 Wall St;Toronto;On;L6v 4c6;Ca X-SAMSUNGADR:;;67 Entity Dr.;Markham;On;L78 14b;Ca;67 Entity Dr. nMarkham , On L78 14b nCa ADR;TYPE=HOME:;;67 Entity Dr.;Markham;On;L78 14b;Ca X-SAMSUNGADR:;;567 Wall St;Toronto;On;L6v 4c6;Ca;567 Wall St nToronto , On L6v 4c6 nCa ADR;TYPE=WORK:;;567 Wall St;Toronto;On;L6v 4c6;Ca X-SAMSUNGADR:;;67 Entity Dr.;Markham;On;L78 14b;Ca;67 Entity Dr. nMarkham , On L78 14b nCa ADR;TYPE=HOME:;;67 Entity Dr.;Markham;On;L78 14b;Ca X-SAMSUNGADR:;;567 Wall St;Toronto;On;L6v 4c6;Ca;567 Wall St nToronto , On L6v 4c6 nCa ADR;TYPE=WORK:;;567 Wall St;Toronto;On;L6v 4c6;Ca URL:www.jimmy.com URL:www.jimmy.com URL:www.jimmy.com END:VCARD';
    var str = data;
    DotNet.invokeMethodAsync('NewBlazorApp','Ping',str)
    .then(data => {      
        console.log('Ping return');

        console.log(str);
        console.log(data);
        Microsoft.Dynamics.NAV.InvokeExtensibilityMethod('PingResult',[data]);
    })
}