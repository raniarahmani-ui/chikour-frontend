import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

const WebbisFooter = lazy(() => import("@/apps/webbis/pages/footer.jsx"));
const WebbisForgotPass = lazy(() =>
  import("@/apps/webbis/pages/ForgotPass.jsx")
);
const WebbisCategoriePage = lazy(() =>
  import("@/apps/webbis/pages/CategoriesPage.jsx")
);

const WebbisProfile = lazy(() => import("@/apps/webbis/pages/profile.jsx"));
const WebbisRatingAndReport = lazy(() =>
  import("@/apps/webbis/pages/ratingAndReport.jsx")
);
const WebbisServiceManagement = lazy(() =>
  import("@/apps/webbis/pages/ServiceManagement.jsx")
);
const WebbisTransactions = lazy(() =>
  import("@/apps/webbis/pages/transactions.jsx")
);
const WebbisSignUp = lazy(() =>
  import("@/apps/webbis/pages/SignUpPage(user).jsx")
);
const WebbisUserManagement = lazy(() =>
  import("@/apps/webbis/pages/UserManagment.jsx")
);
const WebbisCreateService = lazy(() =>
  import("@/apps/webbis/pages/CreateService.jsx")
);
const WebbisCreateDemand = lazy(() =>
  import("@/apps/webbis/pages/CreateDemand.jsx")
);

const SwapieDashboard = lazy(() =>
  import("@/apps/swapie_project/pages/Dashboard/Dashboard.jsx")
);
const SwapieLanding = lazy(() =>
  import("@/apps/swapie_project/pages/LandingPage/LandingPage.jsx")
);
const SwapieManageReports = lazy(() =>
  import("@/apps/swapie_project/pages/ManageReports/ManageReports.jsx")
);
const SwapieSignIn = lazy(() =>
  import("@/apps/swapie_project/pages/SignInPage/SignInPage.jsx")
);
const SwapieTransactions = lazy(() =>
  import("@/apps/swapie_project/pages/Transactions/Transactions.jsx")
);

const SwapieAppBuyCoins = lazy(() =>
  import("@/apps/swapiee/pages/Buycoins.jsx")
);
const SwapieAppDemandDetail = lazy(() =>
  import("@/apps/swapiee/pages/DemandDetail.jsx")
);
const SwapieAppDemands = lazy(() => import("@/apps/swapiee/pages/demands.jsx"));
const SwapieAppMyServices = lazy(() =>
  import("@/apps/swapiee/pages/MyServices.jsx")
);
const SwapieAppMyServicesDetail = lazy(() =>
  import("@/apps/swapiee/pages/MyServicesDetail.jsx")
);
const SwapieAppMyWallet = lazy(() =>
  import("@/apps/swapiee/pages/MyWallet.jsx")
);
const SwapieAppNotifications = lazy(() =>
  import("@/apps/swapiee/pages/notifications.jsx")
);
const SwapieAppProvider = lazy(() =>
  import("@/apps/swapiee/pages/Providerpage.jsx")
);
const SwapieAppServices = lazy(() =>
  import("@/apps/swapiee/pages/Services.jsx")
);

const MinouchatiChat = lazy(() => import("@/apps/minouchati/Chat.jsx"));
const MinouchatiCreateDemand = lazy(() =>
  import("@/apps/minouchati/CreateDemand.jsx")
);
const MinouchatiCreateService = lazy(() =>
  import("@/apps/minouchati/CreateService.jsx")
);
const MinouchatiErrorPage = lazy(() =>
  import("@/apps/minouchati/ErrorPage.jsx")
);
const MinouchatiSettings = lazy(() => import("@/apps/minouchati/Settings.jsx"));
const MinouchatiUserDetails = lazy(() =>
  import("@/apps/minouchati/UserDetails.jsx")
);

const routeGroups = [
  {
    title: "Webbis",
    description: "Provider marketplace experiences",
    routes: [
      { path: "/webbis/footer", label: "Footer", component: WebbisFooter },
      {
        path: "/webbis/forgotpass",
        label: "Forgot Password",
        component: WebbisForgotPass,
      },
      {
        path: "/webbis/CategoriesPage",
        label: "Categorie managment",
        component: WebbisCategoriePage,
      },
      { path: "/webbis/profile", label: "Profile", component: WebbisProfile },
      {
        path: "/webbis/rating",
        label: "Rating & Report",
        component: WebbisRatingAndReport,
      },
      {
        path: "/webbis/service-management",
        label: "Service Management",
        component: WebbisServiceManagement,
      },
      {
        path: "/webbis/transactions",
        label: "Transactions",
        component: WebbisTransactions,
      },
      { path: "/webbis/signup", label: "Sign Up", component: WebbisSignUp },
      {
        path: "/webbis/user-management",
        label: "User Management",
        component: WebbisUserManagement,
      },
      {
        path: "/webbis/create-service",
        label: "Create Service",
        component: WebbisCreateService,
      },
      {
        path: "/webbis/create-demand",
        label: "Create Demand",
        component: WebbisCreateDemand,
      },
    ],
  },
  {
    title: "Swapie (Web)",
    description: "Marketing site & admin views",
    routes: [
      {
        path: "/swapie/landing",
        label: "Landing Page",
        component: SwapieLanding,
      },
      {
        path: "/swapie/dashboard",
        label: "Dashboard",
        component: SwapieDashboard,
      },
      {
        path: "/swapie/manage-reports",
        label: "Manage Reports",
        component: SwapieManageReports,
      },
      { path: "/swapie/signin", label: "Sign In", component: SwapieSignIn },
      {
        path: "/swapie/transactions",
        label: "Transactions",
        component: SwapieTransactions,
      },
    ],
  },
  {
    title: "Swapie App",
    description: "Product experience for users",
    routes: [
      {
        path: "/swapie-app/buy-coins",
        label: "Buy Coins",
        component: SwapieAppBuyCoins,
      },
      {
        path: "/swapie-app/demand-detail",
        label: "Demand Detail",
        component: SwapieAppDemandDetail,
      },
      {
        path: "/swapie-app/demands",
        label: "Demands",
        component: SwapieAppDemands,
      },
      {
        path: "/swapie-app/my-services",
        label: "My Services",
        component: SwapieAppMyServices,
      },
      {
        path: "/swapie-app/my-services-detail",
        label: "My Services Detail",
        component: SwapieAppMyServicesDetail,
      },
      {
        path: "/swapie-app/my-wallet",
        label: "My Wallet",
        component: SwapieAppMyWallet,
      },
      {
        path: "/swapie-app/notifications",
        label: "Notifications",
        component: SwapieAppNotifications,
      },
      {
        path: "/swapie-app/provider",
        label: "Provider Page",
        component: SwapieAppProvider,
      },
      {
        path: "/swapie-app/Services",
        label: "Services",
        component: SwapieAppServices,
      },
    ],
  },
  {
    title: "Minouchati",
    description: "Messaging and service tools",
    routes: [
      { path: "/minouchati/chat", label: "Chat", component: MinouchatiChat },
      {
        path: "/minouchati/create-demand",
        label: "Create Demand",
        component: MinouchatiCreateDemand,
      },
      {
        path: "/minouchati/create-service",
        label: "Create Service",
        component: MinouchatiCreateService,
      },
      {
        path: "/minouchati/error",
        label: "Error Page",
        component: MinouchatiErrorPage,
      },

      {
        path: "/minouchati/settings",
        label: "Settings",
        component: MinouchatiSettings,
      },
      {
        path: "/minouchati/user-details",
        label: "User Details",
        component: MinouchatiUserDetails,
      },
    ],
  },
];

const RouteDirectory = () => (
  <main className="route-directory">
    <div className="route-directory__hero">
      <p className="eyebrow">Swapie Platform</p>
      <h1>Swapie - Service Exchange Platform</h1>
      <p>
        Use the link hub below to browse every screen without manually swapping
        builds. Each link opens the live page using the shared router.
      </p>
    </div>
    <div className="route-directory__grid">
      {routeGroups.map((group) => (
        <section key={group.title} className="route-section">
          <header>
            <h2>{group.title}</h2>
            <p>{group.description}</p>
          </header>
          <ul className="route-list">
            {group.routes.map((route) => (
              <li key={route.path}>
                <Link to={route.path} className="route-link">
                  <span>{route.label}</span>
                  <span>{route.path}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </main>
);

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner" />
    <p>Loading view…</p>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<SwapieLanding />} />
          <Route path="/routes" element={<RouteDirectory />} />
          {routeGroups.flatMap((group) =>
            group.routes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))
          )}
          <Route path="*" element={<SwapieLanding />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
