"use strict";

try {
    angular.module("editContactTranslations");
} catch (e) {
    angular.module("editContactTranslations", [ "pascalprecht.translate" ]);
}

angular.module("editContactTranslations").config([ "$translateProvider", function($translateProvider) {
    var translations = {
        editContact: {
            remove_field: "Remove field from this contact",
            rename_custom_field: "Rename this custom field",
            address_placeholder: "Address",
            about: {
                TEXT_EMAIL_OPTOUT: "Unsubscribed from all emails",
                TEXT_EMAIL_TRANSACTIONAL: "Subscribed to non-promotional emails",
                TEXT_EMAIL_RECURRING: "Subscribed to all emails",
                SITE_MEMBER: "SITE MEMBER",
                SUBSCRIPTION: "Subscription",
                OTHER: "OTHER",
                COUNTRY: "Country",
                ZIP: "Zip",
                STATE: "State",
                CITY: "City",
                STREET: "Street",
                LAST_NAME: "Last Name",
                FIRST_NAME: "First Name",
                ANNIVERSARY_DATE: "ANNIVERSARY",
                BIRTHDAY_DATE: "BIRTHDAY",
                DATE: "DATE",
                OTHER_WEBSITE: "OTHER WEBSITE",
                PERSONAL_WEBSITE: "PERSONAL WEBSITE",
                COMPANY_WEBSITE: "COMPANY WEBSITE",
                WEBSITE: "WEBSITE",
                ROLE: "POSITION",
                COMPANY: "COMPANY",
                WORK: "Work",
                SHIPPING_ADDRESS: "SHIPPING ADDRESS",
                BILLING_ADDRESS: "BILLING ADDRESS",
                OTHER_ADDRESS: "OTHER ADDRESS",
                WORK_ADDRESS: "WORK ADDRESS",
                HOME_ADDRESS: "HOME ADDRESS",
                ADDRESS: "ADDRESS",
                PHONE_NUMBER: "PHONE NUMBER",
                FAX_PHONE: "FAX",
                MOBILE_PHONE: "MOBILE PHONE",
                WORK_PHONE: "WORK PHONE",
                HOME_PHONE: "HOME PHONE",
                PHONE: "PHONE",
                OTHER_EMAIL: "OTHER EMAIL",
                WORK_EMAIL: "WORK EMAIL",
                MAIN_PHONE: "MAIN PHONE",
                MAIN_EMAIL: "MAIN EMAIL",
                HOME_EMAIL: "HOME EMAIL",
                EMAIL: "EMAIL",
                SITE_MEMBERS_BLOCKED: "Blocked",
                SITE_MEMBERS_PENDING: "Pending Request",
                SITE_MEMBERS_APPROVED: "Site Member",
                NOTES_TITLE: "NOTES",
                GROUPS_LABEL: "GROUPS"
            },
            addNewField: {
                custom: "Custom Field",
                website: "Website",
                date: "Date",
                role: "Position",
                company: "Company",
                address: "Address",
                phone: "Phone",
                email: "Email"
            },
            add_new_field_placeholder: "Add New Field",
            add_new_field_label: "Add Field",
            tag: {
                OTHER: "Other",
                ANNIVERSARY_DATE: "Anniversary",
                BIRTHDAY_DATE: "Birthday",
                DATE: "Date",
                PERSONAL_WEBSITE: "Personal Website",
                COMPANY_WEBSITE: "Company Website",
                WEBSITE: "Website",
                "SHIPPING-ADDRESS_ADDRESS": "Shipping Address",
                "BILLING-ADDRESS_ADDRESS": "Billing Address",
                WORK_ADDRESS: "Work Address",
                HOME_ADDRESS: "Home Address",
                ADDRESS: "Address",
                FAX_PHONE: "Fax",
                MOBILE_PHONE: "Mobile Phone",
                WORK_PHONE: "Work Phone",
                HOME_PHONE: "Home Phone",
                MAIN_PHONE: "Main Phone",
                PHONE: "Phone",
                WORK_EMAIL: "Work Email",
                HOME_EMAIL: "Home Email",
                MAIN_EMAIL: "Main Email",
                EMAIL: "Email"
            },
            add_phone: "Add Phone",
            add_email: "Add Email",
            add_address: "Add Address",
            date_year_placeholder: "Year",
            date_day_placeholder: "Day",
            date_month_placeholder: "Month",
            website_placeholder: "Website",
            address_region_placeholder: "State",
            address_country_placeholder: "Country",
            address_zip_placeholder: "Zip",
            address_city_placeholder: "City",
            address_street_placeholder: "Street",
            address_label: "Address",
            groups_contacted_me: "Contacted Me",
            groups_customers: "Customers",
            groups_create: "Create Group",
            groups_add: "Add To Group",
            groups_label: "Groups",
            note_placeholder: "Add Note...",
            note_label: "Note",
            phone_placeholder: "Phone",
            phone_label: "Phone",
            email_delivery_bounced_info: "This email address can not receive your<br> emails due to misspelling or spam.<br>Check for any typos or mistakes, or<br>delete it if you don’t recognize it, or if it<br>seems strange.",
            email_delivery_bounced: "Bounced",
            email_subscription_type: {
                optOut: "Unsubscribed",
                recurring: "Subscribed",
                transactional: "Subscription not set"
            },
            email_subscription: "Subscription",
            number_error_message: "Enter a valid number",
            year_error_message: "Enter a valid year",
            email_error_message: "Enter a valid email",
            email_placeholder: "Email",
            email_label: "Email",
            role_placeholder: "Position",
            role_label: "Position",
            company_placeholder: "Company Name",
            company_label: "Company",
            last_name_placeholder: "Last Name",
            last_name_label: "Last Name",
            first_name_placeholder: "First Name",
            first_name_label: "First Name",
            apply: "Apply",
            cancel: "Cancel",
            confirm: "Save",
            error_invalid: "Scroll through your contact info, and check everything is entered correctly. Remember to add at least one of the required fields: name, email or phone.",
            error_empty: "Enter the contact's details and then click Save.",
            error_save: "Oops something went wrong, please try again.",
            title_create: "New Contact",
            title_edit: "{{contactName}}"
        }
    };
    $translateProvider.translations("en", translations);
    $translateProvider.translations(translations);
    if ($translateProvider.preferredLanguage) {
        $translateProvider.preferredLanguage("en");
    }
} ]).value("preferredLanguage", "en");