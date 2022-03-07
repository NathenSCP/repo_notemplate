pageextension 50402 "SCP Item Tracking Lines" extends "Item Tracking Lines"
{
    layout
    {
        /*
        modify("Serial No.")
        {
            trigger OnAfterValidate()
            var
                lGCI: Record "SCP Gci Tracking";
            begin

                lGCI.Reset();
                lGCI.SetRange("Serial No.", xRec."Serial No.");
                lGCI.DeleteAll();                
            end;
        }*/
        /*
        addafter("Serial No.")
        {
            field("GCI No."; Rec."GCI Number")
            {
                ApplicationArea = All;
                Caption = 'GCI Number';
            }
        }*/
    }

    actions
    {
        addafter("Assign Serial No.")
        {
            action("Add GIA Number")
            {
                ApplicationArea = All;
                Caption = 'GIA/Serial No.';
                Image = SerialNo;
                trigger OnAction()
                var
                    lItem: Record Item;
                    lGCI: Record "SCP Gci Tracking";
                    lPage: page "SCP GCI Tracking";
                    codeunitUtil: Codeunit "RDV Util";
                //entryNo: Integer;
                begin


                    lGCI.SetRange("Serial No.", rec."Serial No.");
                    if lGCI.FindFirst() then begin
                        lPage.SetGlobalSerialNo(Rec."Serial No.", Rec."Item No.", Rec."Entry No.");
                        lpage.SetTableView(lGCI);
                        lPage.RunModal();
                    end
                    else begin
                        if (rec."Serial No." <> '') then begin
                            If codeunitUtil.InsertGIANumberForSerialNumber(Rec) then begin
                                lPage.SetGlobalSerialNo(Rec."Serial No.", Rec."Item No.", Rec."Entry No.");
                                lpage.SetTableView(lGCI);
                                lPage.RunModal();
                            end;
                        end

                    end;
                    /*
                    if lItem.Get(Rec."Item No.") then begin
                        if lItem."SCP Is GCI Mand" then begin
                            if lGCI.IsTemporary then begin
                                Rec.Reset();
                               // entryNo := lGCI.GetEntryNo();
                                if Rec."Serial No." <> '' then begin
                                    repeat
                                        lGCI.SetRange("Serial No.", Rec."Serial No.");
                                        lGCI.DeleteAll();

                                        lGCI.Init();
                                        lGCI."Entry No." := entryNo + 1;
                                        lGCI.Validate("Serial No.", Rec."Serial No.");
                                        lGCI.Validate("Item No.", Rec."Item No.");
                                        lGCI.Validate("Item Ledger Entry No.", Rec."Item Ledger Entry No.");
                                        lGCI.Validate("Tracking Spec Entry No.", Rec."Entry No.");
                                        lGCI.Insert();
                                       // entryNo := entryNo + 1;

                                    until Rec.Next() = 0;
                                end;
                               
                            end
                        end
                        else begin
                            Error('GCI Number is not mandatory for item %1', Rec."Item No.");
                        end;
                    end;*/
                end;
            }
        }
    }
}
