"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAccessibility } from "./accessibility-provider";

const pathToPageName: Record<string, string> = {
  "/": "Home page",
  "/dashboard": "Dashboard",
  "/marketplace": "Marketplace",
  "/opportunities": "Opportunities",
  "/community": "Community",
  "/profile": "Profile",
  "/settings": "Settings",
  "/reviews": "Reviews",
};

export interface PageAnnouncerProps {
  children: React.ReactNode;
}


export const PageAnnouncer: React.FC<PageAnnouncerProps> = ({ children }) => {
  const pathname = usePathname();
  const { announce } = useAccessibility();

  useEffect(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const basePath = `/${pathSegments[0] || ""}`;
    let pageName = pathToPageName[basePath] || "";

    if (pathSegments.length > 1) {
      if (pathSegments[0] === "marketplace" && pathSegments[1] === "sell") {
        pageName = "Sell on Marketplace";
      } else if (pathSegments[0] === "marketplace" && pathSegments[1]) {
        pageName = "Product details";
      } else if (
        pathSegments[0] === "opportunities" &&
        pathSegments[1] === "post"
      ) {
        pageName = "Post new opportunity";
      } else if (pathSegments[0] === "opportunities" && pathSegments[1]) {
        pageName = "Opportunity details";
      } else if (
        pathSegments[0] === "community" &&
        pathSegments[1] === "new-thread"
      ) {
        pageName = "New community thread";
      } else if (
        pathSegments[0] === "community" &&
        pathSegments[1] === "thread"
      ) {
        pageName = "Community thread";
      } else if (pathSegments[0] === "reviews" && pathSegments[1] === "write") {
        pageName = "Write review";
      }
    }

    if (pageName) {
      announce(`Navigated to ${pageName}`, "polite");
    }
  }, [pathname, announce]);

  return <>{children}</>;
};

export default PageAnnouncer;
