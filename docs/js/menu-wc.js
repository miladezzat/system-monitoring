'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">system-monitoring documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/SystemMonitorError.html" data-type="entity-link" >SystemMonitorError</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/CpuCoreInfo.html" data-type="entity-link" >CpuCoreInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CpuInfo.html" data-type="entity-link" >CpuInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DiskUsage.html" data-type="entity-link" >DiskUsage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EnhancedDiskUsage.html" data-type="entity-link" >EnhancedDiskUsage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExtendedUserInfo.html" data-type="entity-link" >ExtendedUserInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileSystemInfo.html" data-type="entity-link" >FileSystemInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadAverage.html" data-type="entity-link" >LoadAverage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LogData.html" data-type="entity-link" >LogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MonitorData.html" data-type="entity-link" >MonitorData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MonitorOptions.html" data-type="entity-link" >MonitorOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NetworkConnection.html" data-type="entity-link" >NetworkConnection</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OSInfo.html" data-type="entity-link" >OSInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScheduledTask.html" data-type="entity-link" >ScheduledTask</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScheduledTasksResponse.html" data-type="entity-link" >ScheduledTasksResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TrackingCustomErrorRequest.html" data-type="entity-link" >TrackingCustomErrorRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TrackTimeOptions.html" data-type="entity-link" >TrackTimeOptions</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});