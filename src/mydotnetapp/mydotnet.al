/// <summary>
/// ControlAddIn DotNetTest.
/// </summary>
controladdin MyDotNetTest
{
    MaximumHeight = 1;
    MaximumWidth = 1;
    MinimumHeight = 1;
    MinimumWidth = 1;
    HorizontalShrink = true;
    VerticalShrink = true;
    RequestedHeight = 1;
    RequestedWidth = 1;
    Scripts = './src/mydotnetapp/_framework/blazor.webassembly.js', './src/mydotnetapp/_framework/wasm/dotnet.3.2.0.js', './src/mydotnetapp/script.js';
    Images = './src/mydotnetapp/_framework/blazor.boot.json',
    './src/mydotnetapp/_framework/wasm/dotnet.timezones.dat.png',
    './src/mydotnetapp/_framework/wasm/dotnet.wasm.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.AspNetCore.Components.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.AspNetCore.Components.Web.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.AspNetCore.Components.WebAssembly.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Bcl.AsyncInterfaces.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.Configuration.Abstractions.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.Configuration.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.Configuration.Json.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.DependencyInjection.Abstractions.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.DependencyInjection.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.Logging.Abstractions.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.Logging.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.Options.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.Extensions.Primitives.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.JSInterop.dll.png',
'./src/mydotnetapp/_framework/_bin/Microsoft.JSInterop.WebAssembly.dll.png',
'./src/mydotnetapp/_framework/_bin/mscorlib.dll.png',
'./src/mydotnetapp/_framework/_bin/NewBlazorApp.dll.png',
'./src/mydotnetapp/_framework/_bin/System.Core.dll.png',
'./src/mydotnetapp/_framework/_bin/System.dll.png',
'./src/mydotnetapp/_framework/_bin/System.Net.Http.dll.png',
'./src/mydotnetapp/_framework/_bin/System.Net.Http.Json.dll.png',
'./src/mydotnetapp/_framework/_bin/System.Net.Http.WebAssemblyHttpHandler.dll.png',
'./src/mydotnetapp/_framework/_bin/System.Runtime.CompilerServices.Unsafe.dll.png',
'./src/mydotnetapp/_framework/_bin/System.Text.Encodings.Web.dll.png',
'./src/mydotnetapp/_framework/_bin/System.Text.Json.dll.png',
'./src/mydotnetapp/_framework/_bin/WebAssembly.Bindings.dll.png';


    StartupScript = './src/mydotnetapp/startup.js';

    procedure Calc(a: Integer; b: Integer);
    procedure Ping(d: Text[2048]);
    event ControlReady();
    event Result(d: Integer);
    event PingResult(t: Text);

}