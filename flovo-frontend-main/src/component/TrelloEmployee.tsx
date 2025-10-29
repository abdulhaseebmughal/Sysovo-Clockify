import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useTheme } from "../context/ThemeContext";

// --------- Types ----------
interface UserShort {
  _id: string;
  name: string;
  email?: string;
  subRole?: string;
}

interface Board {
  _id: string;
  name: string;
  description?: string;
  createdBy?: string;
  members?: string[] | UserShort[];
}

interface ListType {
  _id: string;
  title: string;
  boardId: string;
  position: number;
  cards?: CardType[];
}

interface CardType {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  assignedTo?: string | UserShort | null;
  position: number;
  status?: "Pending" | "In Progress" | "OnHold" | "Completed";
  dueDate?: string | null;
}

// --------- Config ----------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://sysovo-backend.vercel.app",
});

// attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// --------- Component ----------
export default function TrelloEmployee() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListType[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Board creation states
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState<Record<string, string>>({});

  // Modal states
  const [editingCard, setEditingCard] = useState<CardType | null>(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);

    fetchMyBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) fetchListsAndCards(selectedBoard._id);
    else setLists([]);
  }, [selectedBoard]);

  // --------- Fetch functions ----------
  const fetchMyBoards = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/boards");

      const fetchedBoards = Array.isArray(res.data.boards) ? res.data.boards : [];

      // Get current user ID
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user._id;

      // Filter boards: show boards created by user OR where user is a member
      const myBoards = fetchedBoards.filter((board: Board) => {
        // Show if user created this board
        if (board.createdBy === userId) return true;

        // Also show if user is a member
        if (!board.members) return false;
        return board.members.some((member: any) => {
          if (typeof member === "string") {
            return member === userId;
          }
          return member._id === userId;
        });
      });

      setBoards(myBoards);
    } catch (err: any) {
      console.error("Failed fetching boards:", err);
      alert("Failed to fetch boards. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const fetchListsAndCards = async (boardId: string) => {
    try {
      setLoading(true);
      const resLists = await api.get(`/api/lists/${boardId}`);
      const fetchedLists: ListType[] = resLists.data.lists || resLists.data;

      const listsWithCards = await Promise.all(
        fetchedLists.map(async (list) => {
          const resCards = await api.get(`/api/cards/${list._id}`);
          const cards: CardType[] = resCards.data.cards || resCards.data;

          // Show all cards (no filter - employee can see and manage all cards in their boards)
          return { ...list, cards: cards.sort((a, b) => a.position - b.position) };
        })
      );

      // sort lists by position
      listsWithCards.sort((a, b) => a.position - b.position);
      setLists(listsWithCards);
    } catch (err) {
      console.error("Failed loading lists/cards:", err);
      alert("Failed to load board lists/cards.");
    } finally {
      setLoading(false);
    }
  };

  // --------- Update functions (status only) ----------
  const handleUpdateCard = async (updates: Partial<CardType>) => {
    if (!editingCard) return;
    try {
      const res = await api.put(`/api/cards/${editingCard._id}`, updates);
      const updated: CardType = res.data.card || res.data;

      // Update the lists state with the new card data
      setLists((prev) =>
        prev.map((l) => {
          if (l._id === updated.listId || l._id === editingCard.listId) {
            return {
              ...l,
              cards: l.cards?.map((c) => (c._id === updated._id ? updated : c))
            };
          }
          return l;
        })
      );

      setEditingCard(null);
      alert("Task updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update card.");
    }
  };

  // --------- Delete functions (Disabled for Employees) ----------
  // const handleDeleteList = async (listId: string) => {
  //   if (!confirm("Delete this list and all its cards?")) return;
  //   try {
  //     await api.delete(`/api/lists/${listId}`);
  //     setLists((p) => p.filter((l) => l._id !== listId));
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to delete list.");
  //   }
  // };

  // const handleDeleteCard = async (cardId: string, listId: string) => {
  //   if (!confirm("Delete this card?")) return;
  //   try {
  //     await api.delete(`/api/cards/${cardId}`);
  //     setLists((prev) =>
  //       prev.map((l) =>
  //         l._id === listId ? { ...l, cards: l.cards?.filter((c) => c._id !== cardId) } : l
  //       )
  //     );
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to delete card.");
  //   }
  // };

  // --------- Board/List/Card Creation ----------
  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      alert("Board name is required");
      return;
    }
    try {
      await api.post("/api/boards", {
        name: newBoardName,
        description: newBoardDesc,
      });
      setNewBoardName("");
      setNewBoardDesc("");
      fetchMyBoards();
    } catch (err) {
      console.error(err);
      alert("Failed to create board");
    }
  };

  const handleCreateList = async () => {
    if (!selectedBoard || !newListTitle.trim()) {
      alert("List title is required");
      return;
    }
    try {
      await api.post("/api/lists", {
        title: newListTitle,
        boardId: selectedBoard._id,
      });
      setNewListTitle("");
      fetchListsAndCards(selectedBoard._id);
    } catch (err) {
      console.error(err);
      alert("Failed to create list");
    }
  };

  const handleAddCard = async (listId: string) => {
    const title = newCardTitle[listId]?.trim();
    if (!title) {
      alert("Card title is required");
      return;
    }
    try {
      await api.post("/api/cards", {
        title,
        listId,
      });
      setNewCardTitle((prev) => ({ ...prev, [listId]: "" }));
      if (selectedBoard) fetchListsAndCards(selectedBoard._id);
    } catch (err) {
      console.error(err);
      alert("Failed to add card");
    }
  };

  // update card (used for moving between lists & updating position)
  const updateCardOnServer = async (cardId: string, payload: Partial<CardType>) => {
    try {
      await api.put(`/api/cards/${cardId}`, payload);
    } catch (err) {
      console.error("Failed updating card on server", err);
    }
  };

  // update list position or title
  const updateListOnServer = async (listId: string, payload: Partial<ListType>) => {
    try {
      await api.put(`/api/lists/${listId}`, payload);
    } catch (err) {
      console.error("Failed updating list on server", err);
    }
  };

  // --------- Drag & Drop Handler ----------
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination) return;

    // reorder lists (type = "COLUMN" if we set it so)
    if (type === "COLUMN") {
      const newLists = Array.from(lists);
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);
      // update positions locally
      const updated = newLists.map((l, idx) => ({ ...l, position: idx }));
      setLists(updated);
      // persist positions (parallel)
      updated.forEach((l) => updateListOnServer(l._id, { position: l.position }));
      return;
    }

    // card drag
    const sourceListIndex = lists.findIndex((l) => l._id === source.droppableId);
    const destListIndex = lists.findIndex((l) => l._id === destination.droppableId);
    if (sourceListIndex < 0 || destListIndex < 0) return;

    const newLists = lists.map((l) => ({ ...l, cards: [...(l.cards || [])] }));

    // remove from source
    const [movedCard] = newLists[sourceListIndex].cards!.splice(source.index, 1);
    // insert into destination
    newLists[destListIndex].cards!.splice(destination.index, 0, movedCard);

    // update positions in both lists
    newLists[sourceListIndex].cards = newLists[sourceListIndex].cards!.map((c, idx) => ({ ...c, position: idx }));
    newLists[destListIndex].cards = newLists[destListIndex].cards!.map((c, idx) => ({ ...c, position: idx, listId: newLists[destListIndex]._id }));

    setLists(newLists);

    // persist changes: for all affected cards, call update
    const affectedCards = [
      ...newLists[sourceListIndex].cards!,
      ...newLists[destListIndex].cards!,
    ];

    // to avoid sending too many requests, only update cards whose position/listId changed
    const changed = affectedCards.filter((c) => {
      // find original card to compare
      const origList = lists.find((l) => l.cards?.some((oc) => oc._id === c._id));
      const origCard = origList?.cards?.find((oc) => oc._id === c._id);
      if (!origCard) return true;
      return origCard.position !== c.position || origCard.listId !== c.listId;
    });

    // persist in parallel but don't block UI
    changed.forEach((c) => updateCardOnServer(c._id, { position: c.position, listId: c.listId }));
  };

  // --------- Small helpers ----------
  const selectBoard = (board: Board) => {
    setSelectedBoard(board);
  };

  // --------- UI ----------
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "var(--bg-main)" }}>
      {/* Sidebar: Boards */}
      <div style={{
        width: 280,
        borderRight: "1px solid var(--bg-elevated)",
        padding: 20,
        background: "var(--bg-surface)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img
            src="https://res.cloudinary.com/dpi82firq/image/upload/v1759321173/Site_Icon_1_la1sm9.png"
            alt="Sysovo Logo"
            style={{ width: "120px", height: "auto" }}
          />
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => navigate("/employee-dashboard")}
              title="Back to Dashboard"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "var(--text-secondary)",
                padding: "8px 10px",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--primary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <button
              onClick={toggleTheme}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "var(--text-secondary)",
                padding: "8px 10px",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--primary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"}></i>
            </button>
          </div>
        </div>

        <div style={{
          background: "var(--bg-elevated)",
          padding: 14,
          borderRadius: 10,
          marginBottom: 20,
          border: "1px solid var(--border)"
        }}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.5px" }}>LOGGED IN AS</div>
          <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>{currentUser?.name || "Employee"}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{currentUser?.subRole || "Employee"}</div>
        </div>

        {/* Create Board Section */}
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="Board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 8,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
          <input
            placeholder="Description (optional)"
            value={newBoardDesc}
            onChange={(e) => setNewBoardDesc(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 10,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            onClick={handleCreateBoard}
            style={{
              width: "100%",
              padding: "10px",
              background: "#CCFF00",
              color: "#000",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <i className="fas fa-plus"></i>
            Create Board
          </button>
        </div>

        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-secondary)",
          marginBottom: 12,
          letterSpacing: "0.8px",
          textTransform: "uppercase"
        }}>
          My Boards ({boards.length})
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {loading ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>Loading...</div> : null}

          {!loading && boards.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 40,
              color: "var(--text-secondary)",
              fontSize: 13,
              background: "var(--bg-elevated)",
              borderRadius: 8,
              border: "1px dashed var(--border)"
            }}>
              <i className="fas fa-inbox" style={{ fontSize: 24, marginBottom: 10, opacity: 0.5 }}></i>
              <div>No boards assigned yet</div>
            </div>
          ) : null}

          {boards.map((b) => (
            <div
              key={b._id}
              style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
                cursor: "pointer",
                background: selectedBoard?._id === b._id ? "#CCFF00" : "var(--bg-elevated)",
                border: selectedBoard?._id === b._id ? "2px solid #CCFF00" : "1px solid var(--border)",
                transition: "all 0.2s ease",
                boxShadow: selectedBoard?._id === b._id
                  ? "0 2px 8px rgba(204, 255, 0, 0.3)"
                  : "0 1px 3px rgba(0,0,0,0.2)"
              }}
              onClick={() => selectBoard(b)}
              onMouseEnter={(e) => {
                if (selectedBoard?._id !== b._id) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.borderColor = "var(--border-light)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedBoard?._id !== b._id) {
                  e.currentTarget.style.background = "var(--bg-elevated)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }
              }}
            >
              <div style={{
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 4,
                color: selectedBoard?._id === b._id ? "var(--bg-main)" : "var(--text-primary)",
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>{b.name}</div>
              <div style={{
                fontSize: 11,
                color: selectedBoard?._id === b._id ? "var(--bg-hover)" : "var(--text-secondary)",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>{b.description || "No description"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Board content */}
      <div style={{ flex: 1, padding: 28, overflowX: "auto", background: "var(--bg-main)" }}>
        {!selectedBoard ? (
          <div style={{
            padding: 80,
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: 16,
            background: "var(--bg-surface)",
            borderRadius: 16,
            border: "1px solid var(--border)"
          }}>
            <i className="fas fa-arrow-left" style={{ marginRight: 10, fontSize: 18 }}></i>
            Select a board to view your assigned tasks
          </div>
        ) : (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              background: "var(--bg-surface)",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              border: "1px solid var(--border)"
            }}>
              <div>
                <h2 style={{
                  margin: "0 0 6px 0",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px"
                }}>{selectedBoard.name}</h2>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{selectedBoard.description || "No description"}</div>
              </div>

              <div style={{
                padding: "12px 20px",
                background: "linear-gradient(135deg, rgba(204, 255, 0, 0.1), rgba(204, 255, 0, 0.05))",
                borderRadius: 8,
                border: "1px solid rgba(204, 255, 0, 0.3)"
              }}>
                <div style={{ fontSize: 12, color: "#CCFF00", marginBottom: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fas fa-bolt"></i>
                  Stay Productive
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Organize your work and achieve your goals!
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: "flex", gap: 12 }}>
                      {lists.map((list, listIndex) => (
                        <Draggable draggableId={list._id} index={listIndex} key={list._id}>
                          {(providedList) => (
                            <div
                              ref={providedList.innerRef}
                              {...providedList.draggableProps}
                              style={{
                                minWidth: 300,
                                maxWidth: 320,
                                background: "var(--bg-surface)",
                                padding: 14,
                                borderRadius: 12,
                                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                                border: "1px solid var(--border)",
                                ...providedList.draggableProps.style,
                              }}
                            >
                              <div {...providedList.dragHandleProps} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                                paddingBottom: 10,
                                borderBottom: "2px solid var(--border)"
                              }}>
                                <strong style={{
                                  fontSize: 16,
                                  fontWeight: 700,
                                  color: "var(--text-primary)",
                                  letterSpacing: "-0.3px"
                                }}>{list.title}</strong>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <span style={{
                                    fontSize: 12,
                                    color: "var(--bg-main)",
                                    background: "#CCFF00",
                                    padding: "4px 10px",
                                    borderRadius: 12,
                                    fontWeight: 600
                                  }}>
                                    {list.cards?.length || 0}
                                  </span>
                                  {/* Delete button removed - only CEO can delete lists */}
                                </div>
                              </div>

                              <Droppable droppableId={list._id} type="CARD">
                                {(providedCards) => (
                                  <div ref={providedCards.innerRef} {...providedCards.droppableProps} style={{ marginTop: 8, minHeight: 60 }}>
                                    {list.cards && list.cards.length > 0 ? (
                                      list.cards.map((card, idx) => (
                                        <Draggable draggableId={card._id} index={idx} key={card._id}>
                                          {(providedCard) => (
                                            <div
                                              ref={providedCard.innerRef}
                                              {...providedCard.draggableProps}
                                              {...providedCard.dragHandleProps}
                                              onClick={() => setEditingCard(card)}
                                              style={{
                                                padding: 12,
                                                marginBottom: 8,
                                                borderRadius: 8,
                                                background: "var(--bg-elevated)",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                                cursor: "pointer",
                                                position: "relative",
                                                border: "1px solid var(--border)",
                                                transition: "all 0.2s ease",
                                                ...providedCard.draggableProps.style,
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "var(--bg-hover)";
                                                e.currentTarget.style.borderColor = "#CCFF00";
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "var(--bg-elevated)";
                                                e.currentTarget.style.borderColor = "var(--border)";
                                              }}
                                            >
                                              <div style={{
                                                fontWeight: 600,
                                                fontSize: 15,
                                                marginBottom: 8,
                                                color: "var(--text-primary)",
                                                letterSpacing: "-0.3px",
                                                lineHeight: 1.4
                                              }}>{card.title}</div>
                                              {card.description && (
                                                <div style={{
                                                  fontSize: 13,
                                                  color: "var(--text-secondary)",
                                                  marginBottom: 10,
                                                  lineHeight: 1.5
                                                }}>{card.description}</div>
                                              )}
                                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
                                                {card.status && (
                                                  <span
                                                    style={{
                                                      fontSize: 11,
                                                      padding: "4px 10px",
                                                      borderRadius: 14,
                                                      background:
                                                        card.status === "Completed"
                                                          ? "#10b981"
                                                          : card.status === "OnHold"
                                                          ? "#f59e0b"
                                                          : "#6b7280",
                                                      color: "#fff",
                                                      fontWeight: 600
                                                    }}
                                                  >
                                                    {card.status}
                                                  </span>
                                                )}
                                                {card.dueDate && (
                                                  <span style={{
                                                    fontSize: 11,
                                                    color: "var(--text-primary)",
                                                    background: "var(--border)",
                                                    padding: "4px 10px",
                                                    borderRadius: 14,
                                                    fontWeight: 600
                                                  }}>
                                                    <i className="fas fa-calendar" style={{ marginRight: 4, color: "#CCFF00" }}></i>
                                                    {new Date(card.dueDate).toLocaleDateString()}
                                                  </span>
                                                )}
                                              </div>
                                              {/* Delete button removed - only CEO can delete cards */}
                                            </div>
                                          )}
                                        </Draggable>
                                      ))
                                    ) : (
                                      <div style={{
                                        textAlign: "center",
                                        padding: 20,
                                        color: "var(--text-secondary)",
                                        fontSize: 12,
                                        fontStyle: "italic"
                                      }}>
                                        No tasks assigned to you
                                      </div>
                                    )}
                                    {providedCards.placeholder}
                                  </div>
                                )}
                              </Droppable>

                              {/* Add Card Button */}
                              <div style={{ marginTop: 10 }}>
                                <input
                                  placeholder="Add a card..."
                                  value={newCardTitle[list._id] || ""}
                                  onChange={(e) => setNewCardTitle((prev) => ({ ...prev, [list._id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newCardTitle[list._id]?.trim()) {
                                      handleAddCard(list._id);
                                    }
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 6,
                                    color: "var(--text-primary)",
                                    fontSize: 13,
                                    outline: "none",
                                    marginBottom: 6,
                                  }}
                                />
                                <button
                                  onClick={() => handleAddCard(list._id)}
                                  style={{
                                    width: "100%",
                                    padding: "8px",
                                    background: "#CCFF00",
                                    color: "#000",
                                    border: "none",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                  }}
                                >
                                  <i className="fas fa-plus"></i>
                                  Add Card
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Add List Button */}
                      <div
                        style={{
                          minWidth: 300,
                          background: "var(--bg-elevated)",
                          padding: 14,
                          borderRadius: 12,
                          border: "1px dashed var(--border)",
                        }}
                      >
                        <input
                          placeholder="List title..."
                          value={newListTitle}
                          onChange={(e) => setNewListTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newListTitle.trim()) {
                              handleCreateList();
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            marginBottom: 10,
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={handleCreateList}
                          style={{
                            width: "100%",
                            padding: "10px",
                            background: "#CCFF00",
                            color: "#000",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <i className="fas fa-plus"></i>
                          Add List
                        </button>
                      </div>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </>
        )}
      </div>

      {/* Card Status Update Modal */}
      {editingCard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setEditingCard(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              borderRadius: 12,
              padding: 24,
              width: 500,
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid var(--border)"
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              <i className="fas fa-tasks" style={{ marginRight: 8, color: "#CCFF00" }}></i>
              Update Task Status
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Title</label>
              <input
                value={editingCard.title}
                disabled
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  background: "var(--bg-elevated)",
                  outline: "none",
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Description</label>
              <textarea
                value={editingCard.description || "No description"}
                disabled
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  minHeight: 80,
                  fontFamily: "inherit",
                  color: "var(--text-secondary)",
                  background: "var(--bg-elevated)",
                  outline: "none",
                  cursor: "not-allowed",
                  resize: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#CCFF00" }}>
                ⬇️ Status (You can change this)
              </label>
              <select
                value={editingCard.status || "Pending"}
                onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "2px solid #CCFF00",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  outline: "none",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                <option value="Pending" style={{ background: "var(--bg-elevated)" }}>⏳ Pending</option>
                <option value="In Progress" style={{ background: "var(--bg-elevated)" }}>🔄 In Progress</option>
                <option value="OnHold" style={{ background: "var(--bg-elevated)" }}>⏸️ On Hold</option>
                <option value="Completed" style={{ background: "var(--bg-elevated)" }}>✅ Completed</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Due Date</label>
              <input
                type="date"
                value={editingCard.dueDate ? editingCard.dueDate.split("T")[0] : ""}
                disabled
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  background: "var(--bg-elevated)",
                  outline: "none",
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingCard(null)}
                style={{
                  padding: "10px 20px",
                  background: "var(--border)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--border-light)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--border)"}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateCard({
                    status: editingCard.status
                  })
                }
                style={{
                  padding: "10px 20px",
                  background: "#CCFF00",
                  color: "var(--bg-main)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#d9ff33";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#CCFF00";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
