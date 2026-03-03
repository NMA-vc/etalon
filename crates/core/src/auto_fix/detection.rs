use crate::auto_fix::types::FixLocation;
use regex::Regex;

fn count_lines_before(code: &str, index: usize) -> usize {
    code[..index].matches('\n').count() + 1
}

fn find_column(code: &str, index: usize) -> usize {
    if let Some(newline_idx) = code[..index].rfind('\n') {
        index - newline_idx
    } else {
        index
    }
}

pub fn find_script_tags(code: &str, domain_pattern: &str) -> Vec<FixLocation> {
    let mut locations = Vec::new();
    let pat = format!(
        r#"<[Ss]cript[^>]*src=["'][^"']*?{}[^"']*?["'][^>]*>"#,
        domain_pattern
    );
    if let Ok(re) = Regex::new(&pat) {
        for mat in re.find_iter(code) {
            locations.push(FixLocation {
                file: String::new(),
                line: count_lines_before(code, mat.start()),
                column: find_column(code, mat.start()),
                code: mat.as_str().to_string(),
                context: "script".to_string(),
            });
        }
    }
    locations
}

pub fn find_next_script_tags(code: &str, domain_pattern: &str) -> Vec<FixLocation> {
    let mut locations = Vec::new();
    let pat = format!(
        r#"<Script[^>]*src=["'][^"']*?{}[^"']*?["'][^>]*\\?>"#,
        domain_pattern
    );
    if let Ok(re) = Regex::new(&pat) {
        for mat in re.find_iter(code) {
            locations.push(FixLocation {
                file: String::new(),
                line: count_lines_before(code, mat.start()),
                column: find_column(code, mat.start()),
                code: mat.as_str().to_string(),
                context: "component".to_string(),
            });
        }
    }
    locations
}

pub fn find_function_calls(code: &str, func_pattern: &str) -> Vec<FixLocation> {
    let mut locations = Vec::new();
    let pat = format!(r"{}\([^)]*\)", func_pattern);
    if let Ok(re) = Regex::new(&pat) {
        for mat in re.find_iter(code) {
            locations.push(FixLocation {
                file: String::new(),
                line: count_lines_before(code, mat.start()),
                column: find_column(code, mat.start()),
                code: mat.as_str().to_string(),
                context: "hook".to_string(),
            });
        }
    }
    locations
}

pub fn wrap_code_in_consent(
    original: &str,
    full_code: &str,
    framework: &str,
    category: &str,
) -> String {
    let replacement = match framework {
        "react" | "nextjs" => format!("{{consentState?.{} && (\n  {}\n)}}", category, original),
        "vue" => {
            if original.starts_with("<") {
                let re = Regex::new(r"^(<\w+)").unwrap();
                re.replace(original, format!("$1 v-if=\"userConsent.{}\"", category))
                    .to_string()
            } else {
                format!(
                    "<!-- ETALON: Consent required -->\n<template v-if=\"userConsent.{}\">\n  {}\n</template>",
                    category, original
                )
            }
        }
        _ => format!(
            "if (window.__etalon_consent?.{}) {{\n  {}\n}}",
            category, original
        ),
    };
    full_code.replace(original, &replacement)
}

pub fn wrap_call_in_consent(
    original: &str,
    full_code: &str,
    framework: &str,
    category: &str,
) -> String {
    let replacement = match framework {
        "react" | "nextjs" => format!("if (consentState?.{}) {{\n    {}\n  }}", category, original),
        "vue" => format!("if (userConsent.{}) {{\n    {}\n  }}", category, original),
        _ => format!(
            "if (window.__etalon_consent?.{}) {{\n  {}\n}}",
            category, original
        ),
    };
    full_code.replace(original, &replacement)
}
