//Commented out as this code is not currently needed. Could be used later on.

// /// <summary>
// /// When codeunit is installed into company
// /// Create Job Queue Entry that runs codeunit 50404 daily at 1:00am
// /// </summary>
// codeunit 50405 RDVInstallJobQueueEntry
// {
//     Subtype = Install;

//     trigger OnInstallAppPerCompany()
//     var
//         _Date: Date;
//         _Time: Time;
//     begin
//         //This line will need to be changed or removed when not used in sandbox
//         if CompanyName = 'Test Ex-Rate 08' then begin
//             JobQueueEntry.InitRecurringJob(1440);
//             JobQueueEntry."User ID" := 'SCPSUPPORT';
//             JobQueueEntry."Object Type to Run" := JobQueueEntry."Object Type to Run"::Codeunit;
//             JobQueueEntry."Object ID to Run" := 50404;
//             JobQueueEntry."Object Caption to Run" := 'Update Users Post Allowance';
//             JobQueueEntry.Description := 'Updates the date users are allowed to Post documents within business central';
//             JobQueueEntry.Scheduled := true;

//             _Date := 20220119D;
//             _Time := 060000T; //Sandbox is registering the set time 5 hours back. 6am is 1am. Might need to be altered to fit production.
//             JobQueueEntry."Earliest Start Date/Time" := System.CreateDateTime(_Date, _Time);
//             JobQueueEntry."Run on Sundays" := true;
//             JobQueueEntry."Run on Mondays" := true;
//             JobQueueEntry."Run on Tuesdays" := true;
//             JobQueueEntry."Run on Wednesdays" := true;
//             JobQueueEntry."Run on Thursdays" := true;
//             JobQueueEntry."Run on Fridays" := true;
//             JobQueueEntry."Run on Saturdays" := true;
//             JobQueueEntry.Insert();
//         end;
//     end;

//     var
//         JobQueueEntry: Record "Job Queue Entry";
// }