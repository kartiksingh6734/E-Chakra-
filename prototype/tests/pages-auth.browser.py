"""Local, optional Firebase Auth Emulator regression. See docs/testing.md."""

import json
import os
import re
import uuid
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

SITE = "http://127.0.0.1:8190/E-Chakra-/"
EMULATOR = "http://127.0.0.1:9099"
phone = "+16505550123"
test_id = uuid.uuid4().hex[:9]
email = "collector-" + test_id + "@example.test"
errors = []
forbidden_api = []

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path=os.environ.get("ECHAKRA_CHROMIUM"), args=["--no-sandbox"]
    )
    ctx = browser.new_context(locale="en-IN", viewport={"width": 390, "height": 844})

    def handle(route):
        url = urlparse(route.request.url)
        if url.scheme in ("http", "https") and url.hostname not in (
            "127.0.0.1",
            "apis.google.com",
            "www.gstatic.com",
        ):
            route.abort()
        elif url.path.startswith("/api/"):
            forbidden_api.append(url.path)
            route.abort()
        else:
            route.continue_()

    ctx.route("**/*", handle)
    page = ctx.new_page()
    page.set_default_timeout(12000)
    page.on("pageerror", lambda error: errors.append(str(error)))

    def btn(name):
        return page.get_by_role("button", name=name, exact=True).first

    def login_google(first):
        with page.expect_popup() as window:
            btn("Continue with Google").click()
        popup = window.value
        expect(popup).to_have_url(re.compile(r"^http://127\.0\.0\.1:9099/"))
        if first:
            popup.get_by_role("button", name="Add new account").click()
            popup.get_by_label("Email", exact=True).fill(email)
            popup.locator("input").nth(1).fill("Demo Collector")
            popup.get_by_role("button", name="Sign in with Google.com").click()
        else:
            popup.get_by_text(email, exact=True).click()
        expect(btn("Sign out")).to_be_visible()
        page.locator(".app-header select").select_option("en")

    try:
        page.goto(SITE)
        login_google(True)
        print("PASS Google account sign-in using the Firebase emulator.", flush=True)
        btn("Create a lot").click()
        btn("Circuit boards").click()
        page.get_by_label(re.compile("Approximate quantity")).fill("5")
        page.get_by_label("Location", exact=True).fill("Demo desk")
        page.get_by_label("Notes (optional)").fill("Google lot " + test_id)
        page.locator("input[type=file]").set_input_files(
            Path(__file__).resolve().parents[1] / "public/icon-192.png"
        )
        expect(page.locator(".photo-upload img")).to_be_visible()
        btn("Save lot").click()
        expect(page.locator("main .lot-row")).to_have_count(1)
        page.locator("main .lot-row").click()
        expect(page.get_by_text("Google lot " + test_id, exact=True)).to_be_visible()
        expect(page.locator(".detail-top img")).to_have_attribute(
            "src", re.compile("^blob:")
        )
        btn("Add demo offers").click()
        expect(page.locator(".offer-card")).to_have_count(2)
        print("PASS account-scoped lot creation, attachment, offers.", flush=True)
        page.reload()
        expect(page.get_by_text("Google lot " + test_id, exact=True)).to_be_visible()
        second_tab = ctx.new_page()
        second_tab.goto(page.url)
        expect(
            second_tab.get_by_text("Google lot " + test_id, exact=True)
        ).to_be_visible()
        btn("Sign out").click()
        expect(btn("Continue with Google")).to_be_visible()
        expect(
            second_tab.get_by_role("button", name="Continue with Google")
        ).to_be_visible()
        expect(second_tab.get_by_text("Google lot " + test_id)).to_have_count(0)
        page.get_by_label("Mobile number with country code").fill("1234")
        btn("Send SMS code").click()
        expect(page.get_by_role("alert")).to_contain_text("country code")
        page.get_by_label("Mobile number with country code").fill(phone)
        btn("Send SMS code").click()
        otp_box = page.get_by_label("6-digit verification code")
        expect(otp_box).to_be_visible()
        codes = json.load(
            urlopen(EMULATOR + "/emulator/v1/projects/demo-echakra/verificationCodes")
        )["verificationCodes"]
        correct = next(
            code["code"] for code in reversed(codes) if code["phoneNumber"] == phone
        )
        otp_box.fill("000000" if correct != "000000" else "111111")
        btn("Verify and sign in").click()
        expect(page.get_by_role("alert")).to_be_visible()
        otp_box.fill(correct)
        btn("Verify and sign in").click()
        expect(btn("Sign out")).to_be_visible()
        page.locator(".app-header select").select_option("en")
        btn("My lots").click()
        expect(page.locator("main .lot-row")).to_have_count(0)
        print(
            "PASS invalid phone input, wrong SMS code, successful emulator verification, second account has no previous records.",
            flush=True,
        )
        btn("Sign out").click()
        login_google(False)
        btn("My lots").click()
        expect(page.locator("main .lot-row")).to_have_count(1)
        page.locator("main .lot-row").click()
        expect(page.get_by_text("Google lot " + test_id)).to_be_visible()
        assert not errors, errors
        assert not forbidden_api, forbidden_api
        print(
            "PASS cross-tab sign-out, session persistence, account isolation and original records restored at next sign-in.",
            flush=True,
        )
    except BaseException:
        print(
            "UI",
            page.locator("body").inner_text()[:1750],
            "ERRORS",
            errors,
            "API",
            forbidden_api,
            flush=True,
        )
        raise
    finally:
        browser.close()
