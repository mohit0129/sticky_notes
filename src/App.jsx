import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [notes, setNotes] = useState(JSON.parse(localStorage.getItem('sticky-notes') || '[]'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    localStorage.setItem('sticky-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (userName) {
      localStorage.setItem('userName', userName);
    }
  }, [userName]);

  // Effect to handle shared notes
  useEffect(() => {
    const handleSharedNote = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const note = urlParams.get('note');
      const sharedBy = urlParams.get('sharedBy');

      if (note) {
        try {
          const decodedNote = JSON.parse(decodeURIComponent(note));
          const newNote = {
            id: decodedNote.id,
            content: decodeURIComponent(decodedNote.content),
            sharedBy: sharedBy ? decodeURIComponent(sharedBy) : 'Unknown',
            createdAt: Date.now(),
          };
          setNotes((prevNotes) => [...prevNotes, newNote]);
        } catch (error) {
          console.error('Error parsing shared note:', error);
        }
      }
      window.history.replaceState({}, document.title, window.location.pathname); // Clear URL parameters
    };

    handleSharedNote();

    return () => {
      window.history.replaceState({}, document.title, window.location.pathname); // Cleanup URL parameters on unmount
    };
  }, []);

  // Effect to delete empty sticky notes older than 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotes((prevNotes) =>
        prevNotes.filter((note) => {
          if (note.content === '' && now - note.createdAt > 20000) {
            return false;
          }
          return true;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addNote = () => {
    const newNote = {
      id: Math.floor(Math.random() * 1000000000),
      content: '',
      createdAt: Date.now(),
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const updateNote = (id, newContent) => {
    const targetNote = notes.find((note) => note.id === id);
    if (targetNote) {
      targetNote.content = newContent;
      setNotes([...notes]);
    }
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const initiateShare = () => {
    if (!userName) {
      setUserName(prompt('Enter your name for sharing:'));
    }
    enterShareMode();
  };

  const enterShareMode = () => {
    const notesElements = document.querySelectorAll('.note');
    notesElements.forEach((note) => {
      note.classList.add('selectable');
      note.addEventListener('click', handleNoteSelection);
    });
  };

  const handleNoteSelection = (event) => {
    const noteElement = event.target;
    const noteId = getNoteId(noteElement);
    const noteContent = noteElement.value;

    generateShareLink(noteId, noteContent);
  };

  const generateShareLink = (id, content) => {
    const baseUrl = window.location.href.split('?')[0];
    const encodedNote = encodeURIComponent(JSON.stringify({ id, content: encodeURIComponent(content) }));

    const encodedUserName = userName ? encodeURIComponent(userName) : '';
    const shareableLink = `${baseUrl}?note=${encodedNote}&sharedBy=${encodedUserName}`;

    setShareLink(shareableLink);
    setShareModalOpen(true);
    exitShareMode();
  };

  const exitShareMode = () => {
    const notesElements = document.querySelectorAll('.note');
    notesElements.forEach((note) => {
      note.classList.remove('selectable');
      note.removeEventListener('click', handleNoteSelection);
    });
  };

  const closeShareOptions = () => {
    setShareModalOpen(false);
  };

  const copyLink = () => {
    const linkText = document.getElementById('link-text');
    linkText.select();
    linkText.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand('copy');
    alert('Link copied: ' + linkText.value);
  };

  const getNoteId = (noteElement) => {
    const noteIndex = Array.from(document.querySelectorAll('.note')).indexOf(noteElement);
    return notes[noteIndex] ? notes[noteIndex].id : null;
  };

  return (
    <div id="app">
      <button className="add-note" type="button" onClick={addNote}>
        +
      </button>
      <button className="share-note" type="button" onClick={initiateShare}>
        <img src="https://e7.pngegg.com/pngimages/482/306/png-clipart-computer-icons-android-share-icon-sharing-share-sharing-share-icon-thumbnail.png" alt="share" width="30px" />
      </button>
      {/* Share Modal */}
      <div id="share-modal" className="modal" style={{ display: shareModalOpen ? 'block' : 'none' }}>
        <div className="modal-content">
          <span className="close" onClick={closeShareOptions}>
            &times;
          </span>
          <p id="share-link">
            Click to copy the link: <input type="text" id="link-text" readOnly value={shareLink} />
          </p>
          <button onClick={copyLink}>Copy Link</button>
        </div>
      </div>
      {notes.map((note) => (
        <div key={note.id} className="note-container">
          <textarea
            className="note"
            value={note.content}
            placeholder="Empty Sticky Note"
            onChange={(event) => updateNote(note.id, event.target.value)}
            onDoubleClick={() => {
              if (window.confirm("Are you sure? This sticky note won't be recovered once deleted!")) {
                deleteNote(note.id);
              }
            }}
          />
          {note.sharedBy && <p className="shared-by">Shared by {note.sharedBy}</p>}
        </div>
      ))}
    </div>
  );
}

export default App;
