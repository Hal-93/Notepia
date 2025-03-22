export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js"
    );
    console.log("Service Worker registered:", registration);
    return registration;
  } else {
    console.error("Service Worker not supported.");
  }
}

export async function subscribeUser(publicKey: string) {
  const registration = await navigator.serviceWorker.ready;

  if (!publicKey) throw new Error("VAPID_PUBLIC_KEY が設定されていません。");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const res = await fetch("/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  return await res.json();
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  try {
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (error) {
    console.error("Invalid Base64 string:", base64String, error);
    throw error;
  }
}

export const handleSubscribe = async (publicKey: string) => {
  const res = await subscribeUser(publicKey);
  if (res.method === "add") {
    alert("通知をオンにしました！");
  } else if (res.method === "remove") {
    alert("通知をオフにしました...");
  }
};
