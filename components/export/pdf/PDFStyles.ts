import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  // Document and page styles
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.6,
    color: '#1f2937',
  },

  // Cover page styles
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },

  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },

  coverSubtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },

  coverUrl: {
    fontSize: 14,
    color: '#2563eb',
    backgroundColor: '#f0f9ff',
    padding: 12,
    marginBottom: 24,
  },

  coverDate: {
    fontSize: 12,
    color: '#888888',
    marginTop: 40,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottom: 3,
    borderBottomColor: '#3b82f6',
    paddingBottom: 12,
    marginBottom: 28,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 0.5,
  },

  headerDate: {
    fontSize: 9,
    color: '#6b7280',
  },

  // Section styles
  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 14,
    paddingBottom: 6,
    borderBottom: 2,
    borderBottomColor: '#e5e7eb',
    letterSpacing: 0.3,
  },

  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },

  sectionContent: {
    flex: 1,
  },

  // Score and metrics styles
  scoreContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  scoreItem: {
    flex: 1,
    alignItems: 'center',
    textAlign: 'center',
    padding: 14,
    backgroundColor: '#f9fafb',
    border: 1,
    borderColor: '#e5e7eb',
  },

  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  scoreLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },

  // Status indicator styles
  statusGood: {
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: 6,
    fontSize: 10,
    fontWeight: 'bold',
  },

  statusWarning: {
    color: '#d97706',
    backgroundColor: '#fffbeb',
    padding: 6,
    fontSize: 10,
    fontWeight: 'bold',
  },

  statusError: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: 6,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },

  listBullet: {
    width: 16,
    fontSize: 10,
    color: '#666666',
    marginRight: 8,
  },

  listText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.4,
  },

  // Table styles
  table: {
    marginBottom: 14,
    backgroundColor: '#ffffff',
    border: 1,
    borderColor: '#e5e7eb',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  tableHeader: {
    backgroundColor: '#f9fafb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottom: 2,
    borderBottomColor: '#e5e7eb',
  },

  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
    paddingHorizontal: 6,
  },

  tableCellHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 6,
    letterSpacing: 0.3,
  },

  // Recommendation styles
  recommendation: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderLeft: 4,
    borderLeftColor: '#2563eb',
  },

  recommendationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },

  recommendationText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },

  // Critical issue styles
  criticalIssue: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderLeft: 4,
    borderLeftColor: '#dc2626',
  },

  criticalIssueTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },

  criticalIssueText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666666',
    fontSize: 9,
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },

  // Utility styles
  flexRow: {
    flexDirection: 'row',
  },

  flexColumn: {
    flexDirection: 'column',
  },

  textCenter: {
    textAlign: 'center',
  },

  textBold: {
    fontWeight: 'bold',
  },

  marginBottom: {
    marginBottom: 12,
  },

  spacer: {
    height: 20,
  },

  // Badge styles
  badge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 9,
    color: '#374151',
    fontWeight: 'bold',
  },

  badgeSuccess: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
  },

  badgeWarning: {
    backgroundColor: '#fffbeb',
    color: '#d97706',
  },

  badgeError: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
})