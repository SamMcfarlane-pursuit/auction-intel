use axum::response::sse::{Event, Sse};
use futures::stream::{self, Stream};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum RealtimeEvent {
    AuctionUpdate {
        id: String,
        county: String,
        state: String,
        message: String,
    },
    RateChange {
        rate: f64,
        change: f64,
        message: String,
    },
    DealAlert {
        county: String,
        grade: String,
        roi: f64,
        message: String,
    },
    Heartbeat {
        timestamp: String,
    },
}

pub struct RealtimeChannel {
    pub tx: broadcast::Sender<RealtimeEvent>,
}

impl RealtimeChannel {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(100);
        Self { tx }
    }

    pub fn broadcast(&self, event: RealtimeEvent) {
        let _ = self.tx.send(event);
    }
}

pub static REALTIME_CHANNEL: Lazy<Arc<RealtimeChannel>> =
    Lazy::new(|| Arc::new(RealtimeChannel::new()));

pub async fn sse_handler() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = REALTIME_CHANNEL.tx.subscribe();

    let stream = stream::unfold(rx, |mut rx| async move {
        match rx.recv().await {
            Ok(event) => {
                let sse_event = Event::default()
                    .json_data(&event)
                    .unwrap_or_else(|_| Event::default().data("error parsing event"));
                Some((Ok(sse_event), rx))
            }
            Err(broadcast::error::RecvError::Lagged(_)) => {
                // Handle lagging if necessary, for now just continue
                Some((Ok(Event::default().data("lagged")), rx))
            }
            Err(_) => None,
        }
    });

    Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::default())
}

// Background worker to simulate/monitor changes
pub async fn start_realtime_monitor() {
    println!("📡 Starting Realtime Market Monitor...");
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));

    loop {
        interval.tick().await;

        // Simulating a heartbeat or check
        let now = chrono::Utc::now().to_rfc3339();
        REALTIME_CHANNEL.broadcast(RealtimeEvent::Heartbeat { timestamp: now });

        // In a real implementation, we would poll FRED or Auction lists here
        // and broadcast actual changes.
    }
}
