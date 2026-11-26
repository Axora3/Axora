export const ADMIN_SIDEBAR_KEY = "axora-admin-sidebar";

/** Document bootstrap only; route layouts can be mounted by client navigation. */
export const adminSidebarInitScript = `(function(){try{document.documentElement.dataset.adminSidebar=localStorage.getItem(${JSON.stringify(ADMIN_SIDEBAR_KEY)})==="1"?"collapsed":"expanded"}catch(e){}})()`;
