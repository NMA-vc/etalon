import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "AGB - ETALON",
    description: "Allgemeine Geschäftsbedingungen der ETALON-Plattform von NMA Venture Capital GmbH.",
};

export default function AGBPage() {
    const lastUpdated = "11. Februar 2026";

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
                    ← Zurück zu ETALON
                </Link>

                <h1 className="text-3xl font-bold mb-2">Allgemeine Geschäftsbedingungen (AGB)</h1>
                <p className="text-sm text-muted-foreground mb-10">Stand: {lastUpdated}</p>

                <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_a]:text-emerald-400 [&_a]:underline">

                    {/* § 1 */}
                    <section>
                        <h2>§ 1 Geltungsbereich</h2>
                        <p>
                            (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle Verträge zwischen der
                        </p>
                        <p className="pl-4">
                            <strong>NMA Venture Capital GmbH</strong><br />
                            Am Sandtorkai 27<br />
                            D-20457 Hamburg<br />
                            Geschäftsführer: Nico Lumma, Christoph Hüning<br />
                            Handelsregister: Amtsgericht Hamburg, HRB [Registernummer]<br />
                            USt-IdNr.: DE[Nummer]<br />
                            (nachfolgend „Anbieter")
                        </p>
                        <p>
                            und dem Nutzer (nachfolgend „Kunde") über die Nutzung der SaaS-Plattform „ETALON" (nachfolgend „Dienst" oder „Plattform").
                        </p>
                        <p>
                            (2) Abweichende Geschäftsbedingungen des Kunden finden keine Anwendung, es sei denn, der Anbieter stimmt deren Geltung ausdrücklich schriftlich zu.
                        </p>
                        <p>
                            (3) Der Dienst richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB, juristische Personen des öffentlichen Rechts und öffentlich-rechtliche Sondervermögen.
                        </p>
                    </section>

                    {/* § 2 */}
                    <section>
                        <h2>§ 2 Vertragsgegenstand</h2>
                        <p>
                            (1) Der Anbieter stellt dem Kunden über das Internet eine Software-as-a-Service-Lösung zur automatisierten Datenschutz-Prüfung von Webseiten und Quellcode bereit. Der Funktionsumfang ergibt sich aus der jeweils aktuellen Leistungsbeschreibung auf der Webseite des Anbieters.
                        </p>
                        <p>
                            (2) Der Dienst umfasst insbesondere:
                        </p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>Automatisierte Scans von Webseiten auf Drittanbieter-Tracker und Cookies</li>
                            <li>Quellcode-Audits auf DSGVO-Konformität (CLI und Cloud-Dashboard)</li>
                            <li>Compliance-Berichte und Empfehlungen</li>
                            <li>MCP-Server-Integration für KI-gestützte Entwicklungsumgebungen</li>
                            <li>API-Zugang für automatisierte Prüfungen</li>
                        </ul>
                        <p>
                            (3) Der Anbieter stellt den Dienst in der jeweils aktuellen Version zur Verfügung. Ein Anspruch auf Beibehaltung eines bestimmten Funktionsumfangs besteht nicht, sofern die wesentlichen Funktionen des jeweiligen Tarifs erhalten bleiben.
                        </p>
                    </section>

                    {/* § 3 */}
                    <section>
                        <h2>§ 3 Vertragsschluss und Registrierung</h2>
                        <p>
                            (1) Die Darstellung des Dienstes auf der Webseite stellt kein verbindliches Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots (invitatio ad offerendum).
                        </p>
                        <p>
                            (2) Der Kunde gibt durch Abschluss des Registrierungsprozesses ein verbindliches Angebot auf Abschluss eines Nutzungsvertrages ab. Der Vertrag kommt durch die Freischaltung des Kundenkontos zustande.
                        </p>
                        <p>
                            (3) Der Kunde ist verpflichtet, bei der Registrierung wahrheitsgemäße und vollständige Angaben zu machen und diese bei Änderungen unverzüglich zu aktualisieren.
                        </p>
                        <p>
                            (4) Der Kunde ist für die Vertraulichkeit seiner Zugangsdaten verantwortlich. Er hat den Anbieter unverzüglich zu informieren, wenn er Kenntnis von einer missbräuchlichen Nutzung seines Kontos erlangt.
                        </p>
                    </section>

                    {/* § 4 */}
                    <section>
                        <h2>§ 4 Tarife und Leistungsumfang</h2>
                        <p>
                            (1) Der Dienst wird in verschiedenen Tarifen angeboten:
                        </p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li><strong>Free (kostenlos):</strong> Begrenzter Funktionsumfang, eingeschränkte Scan-Anzahl</li>
                            <li><strong>Pro (kostenpflichtig):</strong> Erweiterter Funktionsumfang gemäß der Preisliste auf der Webseite</li>
                            <li><strong>Enterprise:</strong> Individueller Funktionsumfang nach gesonderter Vereinbarung</li>
                        </ul>
                        <p>
                            (2) Der aktuelle Leistungsumfang und die Preise der jeweiligen Tarife sind der Preisübersicht auf der Webseite zu entnehmen.
                        </p>
                        <p>
                            (3) Der Anbieter behält sich vor, den kostenfreien Tarif jederzeit in seinem Funktionsumfang zu ändern oder einzustellen, wobei bestehende kostenpflichtige Verträge davon unberührt bleiben.
                        </p>
                    </section>

                    {/* § 5 */}
                    <section>
                        <h2>§ 5 Preise und Zahlungsbedingungen</h2>
                        <p>
                            (1) Alle auf der Webseite angegebenen Preise verstehen sich in Euro und zuzüglich der jeweils geltenden gesetzlichen Umsatzsteuer, sofern nicht anders angegeben.
                        </p>
                        <p>
                            (2) Die Abrechnung der kostenpflichtigen Tarife erfolgt im Voraus auf monatlicher oder jährlicher Basis, je nach gewähltem Abrechnungszeitraum.
                        </p>
                        <p>
                            (3) Die Zahlung erfolgt über den Zahlungsdienstleister Stripe. Es gelten zusätzlich die Nutzungsbedingungen von Stripe (stripe.com/de/legal).
                        </p>
                        <p>
                            (4) Der Anbieter ist berechtigt, die Preise für kostenpflichtige Tarife mit einer Ankündigungsfrist von vier (4) Wochen zum Ende des jeweiligen Abrechnungszeitraums anzupassen. Der Kunde hat in diesem Fall ein Sonderkündigungsrecht zum Zeitpunkt des Inkrafttretens der Preisänderung.
                        </p>
                        <p>
                            (5) Kommt der Kunde mit der Zahlung in Verzug, ist der Anbieter berechtigt, den Zugang zum Dienst nach erfolgloser Mahnung mit angemessener Fristsetzung zu sperren. Die Pflicht zur Zahlung der vereinbarten Vergütung bleibt hiervon unberührt.
                        </p>
                    </section>

                    {/* § 6 */}
                    <section>
                        <h2>§ 6 Nutzungsrechte</h2>
                        <p>
                            (1) Der Anbieter räumt dem Kunden für die Dauer des Vertrages ein einfaches, nicht übertragbares, nicht unterlizenzierbares Recht ein, den Dienst im Rahmen der vereinbarten Bedingungen zu nutzen.
                        </p>
                        <p>
                            (2) Die ETALON-CLI und der ETALON-Core sind als Open-Source-Software unter der MIT-Lizenz verfügbar. Die vorliegenden AGB gelten ergänzend für die Nutzung der Cloud-Plattform und der zugehörigen API.
                        </p>
                        <p>
                            (3) Der Kunde darf den Dienst nicht für rechtswidrige Zwecke nutzen oder Dritten eine solche Nutzung ermöglichen.
                        </p>
                    </section>

                    {/* § 7 */}
                    <section>
                        <h2>§ 7 Pflichten des Kunden</h2>
                        <p>
                            (1) Der Kunde verpflichtet sich, den Dienst ausschließlich bestimmungsgemäß und im Einklang mit geltendem Recht zu nutzen.
                        </p>
                        <p>
                            (2) Dem Kunden ist insbesondere untersagt:
                        </p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>Die Plattform oder ihre Infrastruktur übermäßig zu belasten oder zu stören</li>
                            <li>Sicherheitsmechanismen zu umgehen oder zu manipulieren</li>
                            <li>Den Dienst zur Durchführung von Angriffen auf Dritte zu verwenden</li>
                            <li>Scans auf Webseiten durchzuführen, für die der Kunde keine Berechtigung hat (soweit dies über öffentlich zugängliche Informationen hinausgeht)</li>
                            <li>API-Zugangsdaten an unbefugte Dritte weiterzugeben</li>
                        </ul>
                        <p>
                            (3) Der Kunde stellt den Anbieter von sämtlichen Ansprüchen Dritter frei, die aufgrund einer rechtswidrigen Nutzung des Dienstes durch den Kunden entstehen.
                        </p>
                    </section>

                    {/* § 8 */}
                    <section>
                        <h2>§ 8 Verfügbarkeit und Support</h2>
                        <p>
                            (1) Der Anbieter ist bemüht, eine Verfügbarkeit des Dienstes von 99,5 % im Jahresmittel zu gewährleisten. Hiervon ausgenommen sind Zeiten geplanter Wartungsarbeiten, höhere Gewalt sowie Störungen, die außerhalb des Einflussbereichs des Anbieters liegen.
                        </p>
                        <p>
                            (2) Geplante Wartungsarbeiten werden, soweit möglich, außerhalb üblicher Geschäftszeiten durchgeführt und mit angemessenem Vorlauf angekündigt.
                        </p>
                        <p>
                            (3) Support wird per E-Mail an info@nma.vc bereitgestellt. Eine bestimmte Reaktionszeit wird nicht zugesichert, der Anbieter ist jedoch bemüht, Anfragen innerhalb von zwei (2) Werktagen zu beantworten.
                        </p>
                    </section>

                    {/* § 9 */}
                    <section>
                        <h2>§ 9 Datenschutz</h2>
                        <p>
                            (1) Der Anbieter verarbeitet personenbezogene Daten des Kunden gemäß der geltenden Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG). Einzelheiten ergeben sich aus der{" "}
                            <Link href="/privacy" className="text-emerald-400 underline">Datenschutzerklärung</Link>.
                        </p>
                        <p>
                            (2) Soweit der Kunde im Rahmen der Nutzung des Dienstes personenbezogene Daten Dritter verarbeitet (z.B. durch Scans von Webseiten), verbleibt der Kunde Verantwortlicher im Sinne der DSGVO. Der Abschluss eines Auftragsverarbeitungsvertrages gemäß Art. 28 DSGVO erfolgt auf Anfrage.
                        </p>
                    </section>

                    {/* § 10 */}
                    <section>
                        <h2>§ 10 Haftung</h2>
                        <p>
                            (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
                        </p>
                        <p>
                            (2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) ist die Haftung des Anbieters auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
                        </p>
                        <p>
                            (3) Im Übrigen ist die Haftung des Anbieters für leichte Fahrlässigkeit ausgeschlossen.
                        </p>
                        <p>
                            (4) Die Scan-Ergebnisse und Compliance-Berichte des Dienstes stellen keine Rechtsberatung dar. Der Anbieter übernimmt keine Gewähr für die Vollständigkeit oder Richtigkeit der automatisierten Prüfungen. Der Kunde ist eigenverantwortlich für die Einhaltung datenschutzrechtlicher Vorgaben.
                        </p>
                        <p>
                            (5) Die vorstehenden Haftungsbeschränkungen gelten auch zugunsten der Erfüllungsgehilfen des Anbieters.
                        </p>
                        <p>
                            (6) Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
                        </p>
                    </section>

                    {/* § 11 */}
                    <section>
                        <h2>§ 11 Laufzeit und Kündigung</h2>
                        <p>
                            (1) Verträge über kostenpflichtige Tarife werden auf unbestimmte Zeit geschlossen und können von beiden Parteien mit einer Frist von einem (1) Monat zum Ende des jeweiligen Abrechnungszeitraums gekündigt werden.
                        </p>
                        <p>
                            (2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt für den Anbieter insbesondere vor, wenn:
                        </p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>der Kunde trotz Mahnung mit der Zahlung fälliger Beträge im Verzug ist</li>
                            <li>der Kunde wiederholt oder schwerwiegend gegen diese AGB verstößt</li>
                            <li>der Kunde den Dienst für rechtswidrige Zwecke nutzt</li>
                        </ul>
                        <p>
                            (3) Die Kündigung bedarf der Textform (E-Mail genügt).
                        </p>
                        <p>
                            (4) Der kostenfreie Tarif kann von beiden Seiten jederzeit ohne Angabe von Gründen beendet werden.
                        </p>
                        <p>
                            (5) Nach Beendigung des Vertrages ist der Kunde berechtigt, seine Daten innerhalb von dreißig (30) Tagen zu exportieren. Danach werden die Daten unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
                        </p>
                    </section>

                    {/* § 12 */}
                    <section>
                        <h2>§ 12 Änderungen der AGB</h2>
                        <p>
                            (1) Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern, soweit dies aus sachlich gerechtfertigten Gründen erforderlich ist (z.B. Änderung der Rechtslage, Erweiterung des Leistungsumfangs, Schließung von Regelungslücken).
                        </p>
                        <p>
                            (2) Der Anbieter wird den Kunden über Änderungen mindestens vier (4) Wochen vor deren Inkrafttreten in Textform informieren. Widerspricht der Kunde nicht innerhalb von vier (4) Wochen nach Zugang der Änderungsmitteilung, gelten die geänderten AGB als angenommen. Der Anbieter wird den Kunden in der Änderungsmitteilung auf die Bedeutung seines Schweigens hinweisen.
                        </p>
                    </section>

                    {/* § 13 */}
                    <section>
                        <h2>§ 13 Schlussbestimmungen</h2>
                        <p>
                            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
                        </p>
                        <p>
                            (2) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist Hamburg, sofern der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder ein öffentlich-rechtliches Sondervermögen ist.
                        </p>
                        <p>
                            (3) Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden, so wird die Wirksamkeit der übrigen Bestimmungen hierdurch nicht berührt. An die Stelle der unwirksamen oder undurchführbaren Bestimmung tritt diejenige wirksame und durchführbare Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
                        </p>
                        <p>
                            (4) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                                ec.europa.eu/consumers/odr
                            </a>.
                            Der Anbieter ist weder bereit noch verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-border/50 flex gap-4 text-xs text-muted-foreground">
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link>
                    <Link href="/cookies" className="hover:text-foreground transition-colors">Cookie-Richtlinie</Link>
                    <Link href="/imprint" className="hover:text-foreground transition-colors">Impressum</Link>
                </div>
            </div>
        </main>
    );
}
