/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/email', 'N/runtime', 'N/format'], (search, email, runtime, format) => {

    function execute() {
        try {
            const scriptObj = runtime.getCurrentScript();
            const recipientEmail = scriptObj.getParameter({ name: 'custscript_admin_list' });

            if (!recipientEmail) {
                log.error('Missing Email Param', 'Please set admin emails on deployment.');
                return;
            }

            // Load saved search
            const mySearch = search.load({ id: 'customsearch4513' }); // make sure correct saved search id is here from your account

            mySearch.run().each(result => {
                const firstLoginDateStr = result.getValue({ name: 'date', join:"loginAuditTrail", summary: search.Summary.MIN });
                const userName = result.getValue({ name: 'entityid', summary: search.Summary.GROUP });

                // Convert to Date object
                const firstLoginDate = format.parse({
                    value: firstLoginDateStr,
                    type: format.Type.DATETIME
                });

                // Time difference in minutes
                const now = new Date();
                const diffMinutes = (now.getTime() - firstLoginDate.getTime()) / (1000 * 60);

                if (diffMinutes >= 0 && diffMinutes <= 20) {
                    log.audit('First Login Detected', `${userName} logged in within last 15 minutes.`);

                    log.debug(recipientEmail)
                    // Send email
                    email.send({
                        author: "3726266", 
                        recipients: recipientEmail,
                        subject: 'First Login Alert — Welcome Our New NetSuite Explorer!',
                        body: `Heads up! 

                            User ${userName} has just logged in for the very first time at ${firstLoginDateStr}.  
                            It’s their debut in the NetSuite universe — let’s make sure they feel right at home.  

                            1. Check that their roles and permissions are correct.  
                            2. Share any quick-start tips or onboarding resources.  
                            3. Give them a warm welcome.

                            Security Note: If you weren’t expecting this login, investigate immediately.`
                    });
                }

                return true; // Continue to next result
            });

        } catch (e) {
            log.error('Error in First Login Alert Script', e);
        }
    }

    return { execute };
});
