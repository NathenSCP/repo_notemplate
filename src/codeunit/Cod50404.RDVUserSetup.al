/// <summary>
/// This code unit will be a job in business central, running every morning at 1:00am.
/// Nathen
/// </summary>
codeunit 50404 RDVUserSetup
{
    trigger OnRun()
    begin
        // UsersToUserSetup();
        UpdateUserSetupPostingDates();
    end;

    /// <summary>
    /// Collects all users from User Table (2000000120) - User Page (9800)
    /// Inserts a record for each user into User Setup table (91) - User Setup Page (119)
    /// </summary>
    local procedure UsersToUserSetup()
    var
        Users: Record User;
        UserSetup: Record "User Setup";
    begin
        if Users.FindSet() then
            repeat
                if UserSetup.Get(Users."User Name") then begin
                    // Do Nothing
                end else begin
                    UserSetup.Init();
                    UserSetup.Validate("User ID", Users."User Name");
                    UserSetup.Validate("Allow Posting From", Today);
                    UserSetup.Validate("Allow Posting To", Today);
                    UserSetup.Insert();
                end;
            until (Users.Next = 0);
    end;

    /// <summary>
    /// Iterate through User Setup Records, changing posting dates to current date
    /// </summary>
    local procedure UpdateUserSetupPostingDates()
    var
        UserSetup: Record "User Setup";

    begin
        if UserSetup.FindSet() then
            repeat
                UserSetup.Validate("Allow Posting From", Today);
                UserSetup.Validate("Allow Posting To", Today);
                UserSetup.Modify();
            until (UserSetup.Next = 0)
    end;
}