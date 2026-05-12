      *----------------------------------------------------------------*
      * VALIDATIONS.CPY - Common validation routines                  *
      *----------------------------------------------------------------*
       01 WS-VALIDATION-STATUS PIC X(1).
          88 VALIDATION-OK     VALUE 'Y'.
          88 VALIDATION-FAIL   VALUE 'N'.
       01 WS-VALIDATION-MSG    PIC X(80) VALUE SPACES.
