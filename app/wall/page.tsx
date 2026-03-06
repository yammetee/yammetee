'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart } from 'lucide-react';
import LoadingGlow from '../components/LoadingGlow';

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  userId?: string;
  avatar?: string;
  likes: number;
}

interface ProfileData {
  userId?: string;
  email: string;
  isAdmin?: boolean;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  userCommentId?: string | null;
}

function getCommentAvatarLabel(comment: Comment) {
  if (comment.isAnonymous) return '?';

  const words = (comment.author || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
  }

  const first = words[0] || '';
  return first.slice(0, 2).toUpperCase() || '?';
}

function getDefaultAuthorName(profile: ProfileData | null) {
  if (!profile) return '';

  const nickname = (profile.nickname || '').trim();
  if (nickname) return nickname;

  const firstName = (profile.firstName || '').trim();
  const lastName = (profile.lastName || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;

  return profile.email || '';
}

export default function Wall() {
  const { t, language } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [defaultAuthor, setDefaultAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
  const [userCommentId, setUserCommentId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const loadingText = language === 'ru' ? 'загрузка...' : 'loading...';
  const overlayLoading = loading || Boolean(likingCommentId) || Boolean(deletingCommentId);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [commentsResponse, profileResponse] = await Promise.all([
          fetch('/api/comments'),
          fetch('/api/me/profile'),
        ]);

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
        }

        if (profileResponse.ok) {
          const profileData: ProfileData = await profileResponse.json();
          const prefilledName = getDefaultAuthorName(profileData);
          setDefaultAuthor(prefilledName);
          setAuthor(prefilledName);
          setUserId(profileData.userId || null);
          setIsAdmin(Boolean(profileData.isAdmin));
          setUserCommentId(profileData.userCommentId || null);
        }
      } catch (error) {
        console.error('Error loading wall data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLike = async (id: string) => {
    setLikingCommentId(id);
    try {
      const response = await fetch(`/api/comments/${id}/like`, {
        method: 'PATCH',
      });
      if (response.ok) {
        const updatedComment = await response.json();
        setComments(comments.map((c) => (c.id === id ? updatedComment : c)));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setLikingCommentId(null);
    }
  };

  const openCreateModal = () => {
    setEditingCommentId(null);
    setAuthor(defaultAuthor);
    setContent('');
    setIsAnonymous(false);
    setIsModalOpen(true);
  };

  const openEditModal = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setAuthor(comment.isAnonymous ? defaultAuthor : comment.author);
    setContent(comment.content);
    setIsAnonymous(comment.isAnonymous);
    setIsModalOpen(true);
  };

  const executeDelete = async (id: string) => {
    try {
      setDeletingCommentId(id);
      const response = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        setMessage(t.wall.error);
        return;
      }

      setComments(comments.filter((comment) => comment.id !== id));
      const deletedWasOwn = userCommentId === id;
      if (deletedWasOwn) {
        setUserCommentId(null);
      }
      setMessage(t.wall.deleted);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setMessage(t.wall.error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const requestDelete = (id: string) => {
    setConfirmDeleteCommentId(id);
  };

  const cancelDelete = () => {
    setConfirmDeleteCommentId(null);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteCommentId) return;
    const targetId = confirmDeleteCommentId;
    setConfirmDeleteCommentId(null);
    await executeDelete(targetId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setMessage(t.wall.fillFields);
      return;
    }
    if (!isAnonymous && !author.trim()) {
      setMessage(t.wall.fillFields);
      return;
    }

    setLoading(true);
    try {
      const isEditing = Boolean(editingCommentId);
      const response = await fetch(isEditing ? `/api/comments/${editingCommentId}` : '/api/comments', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: author.trim(),
          content: content.trim(),
          isAnonymous,
        }),
      });

      if (response.ok) {
        const savedComment = await response.json();

        if (isEditing) {
          setComments(comments.map((comment) => (comment.id === savedComment.id ? savedComment : comment)));
          setMessage(t.wall.updated);
        } else {
          setComments([...comments, savedComment]);
          setUserCommentId(savedComment.id);
          setMessage(t.wall.success);
        }

        setEditingCommentId(null);
        setContent('');
        setAuthor(defaultAuthor);
        setIsAnonymous(false);
        setIsModalOpen(false);
      } else if (response.status === 409) {
        setMessage(t.wall.duplicate);
      } else {
        setMessage(t.wall.error);
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      setMessage(t.wall.error);
    } finally {
      setLoading(false);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  if (initialLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingGlow text={loadingText} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {overlayLoading ? <LoadingGlow overlay text={loadingText} /> : null}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.wall.title}</h1>
      </div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-lg mt-2">{t.wall.description}</p>
          <p className="text-sm text-gray-400 mt-2">{t.wall.oneCommentHint}</p>
        </div>
        {!userCommentId ? (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
          >
            {t.wall.submit}
          </button>
        ) : null}
      </div>

      {message && <p className="mb-4 text-green-400">{message}</p>}

      <div className="space-y-6">
        {comments.map((comment) => {
          const isOwnComment = comment.userId === userId || userCommentId === comment.id;
          const canManageComment = isOwnComment || isAdmin;

          return (
            <div key={comment.id} id={`comment-${comment.id}`} className="bg-neutral-800 p-6 rounded-md">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-base font-semibold">{getCommentAvatarLabel(comment)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">
                      {comment.isAnonymous ? t.wall.anonymous : comment.author}
                    </h3>
                    <span className="text-sm text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-300">{comment.content}</p>
                  <div className="mt-4 flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(comment.id)}
                      disabled={likingCommentId === comment.id}
                      className="flex items-center space-x-1 text-gray-400 hover:text-red-400 cursor-pointer disabled:opacity-60"
                    >
                      <>
                        <Heart size={16} className="fill-current" />
                        <span>{comment.likes}</span>
                      </>
                    </button>
                    {canManageComment ? (
                      <>
                        <button
                          onClick={() => openEditModal(comment)}
                          className="text-sm text-blue-300 hover:text-blue-200"
                        >
                          {t.wall.edit}
                        </button>
                        <button
                          onClick={() => requestDelete(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="text-sm text-red-300 hover:text-red-200 disabled:opacity-60"
                        >
                          {t.wall.delete}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCommentId ? t.wall.edit : t.wall.submit}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="radio"
                    name="type"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="mr-2"
                  />
                  {t.wall.public}
                </label>
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="radio"
                    name="type"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="mr-2"
                  />
                  {t.wall.anonymous}
                </label>
              </div>
              {!isAnonymous && (
                <div className="mb-4">
                  <label htmlFor="author" className="block text-sm font-medium mb-2">{t.wall.name}</label>
                  <input
                    type="text"
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!isAnonymous}
                  />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium mb-2">{t.wall.comment}</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {t.wall.note}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
                >
                  {t.wall.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium"
                >
                  {editingCommentId ? t.wall.save : t.wall.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteCommentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-3">{t.wall.delete}</h2>
            <p className="text-gray-300 mb-5">{t.wall.confirmDelete}</p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
              >
                {t.wall.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-medium"
              >
                {t.wall.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
