page 50406 "PostingDateDialog"
{

    Caption = 'Enter';
    PageType = StandardDialog;

    layout
    {
        area(content)
        {
            group(General)
            {
                field(PostingDate; gdocdate)
                {
                    ApplicationArea = All;
                    Caption = 'Posting Date';
                    Editable = true;
                    trigger OnValidate()
                    begin

                    end;
                }
            }
        }
    }

    trigger OnOpenPage()
    begin
        if gdocdate = 0D then
            gdocdate := Today();
    end;

    trigger OnQueryClosePage(CloseAction: Action): Boolean
    begin
        if CloseAction = CloseAction::Cancel then begin
            gdocdate := Today();
        end;
    end;


    procedure GetNewDate(): Date
    begin
        exit(gdocdate);
    end;

    procedure SetDate(incomingDate: Date)
    begin
        gdocdate := incomingDate;
    end;

    var
        gdocNo: code[20];
        gdocdate: Date;


}
