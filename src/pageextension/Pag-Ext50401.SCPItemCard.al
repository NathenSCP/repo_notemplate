pageextension 50401 "SCP Item Card" extends "Item Card"
{
    layout
    {
        addafter("Item Tracking Code")
        {
            field("SCP Is GCI"; Rec."SCP Is GCI Mand")
            {
                ApplicationArea = All;
                Caption = 'GIA/Serial No. is required';

                trigger OnValidate()
                begin
                    if Rec."SCP Is GCI Mand" = true THEN begin
                        If Rec."Item Tracking Code" <> 'SNALL' then begin
                            Error('Item tracking code must be SNALL');
                        end;
                    end;
                end;
            }
            field("QR Code"; gQRCode)
            {
                ApplicationArea = All;
                Caption = 'QR Code';

                trigger OnValidate()
                begin
                    Message(gQRCode);
                end;
            }
        }

        addafter(Blocked)
        {
            field("Web Item"; Rec."Web Item")
            {
                ApplicationArea = All;
                Caption = 'Web Item';
            }
            field("Show Price"; Rec."Show Price")
            {
                ApplicationArea = All;
                Caption = 'Show Price';
            }
            field("Description 2"; Rec."Description 2")
            {
                ApplicationArea = All;
            }
            field("Description 3"; Rec."Description 3")
            {
                ApplicationArea = all;
            }
        }
    }

    var
        gQRCode: Text[2048];
}
