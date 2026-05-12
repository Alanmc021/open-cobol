      *----------------------------------------------------------------*
      * COMMON.CPY - Shared working storage fields                    *
      *----------------------------------------------------------------*
       01 WS-RETURN-CODE       PIC 9(4) VALUE ZEROS.
       01 WS-ERROR-MESSAGE     PIC X(80) VALUE SPACES.
       01 WS-TIMESTAMP         PIC X(26).
       01 WS-SYSTEM-STATUS     PIC X(1).
          88 SYS-OK            VALUE 'Y'.
          88 SYS-ERROR         VALUE 'N'.
